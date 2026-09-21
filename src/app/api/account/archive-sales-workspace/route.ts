import { NextResponse } from 'next/server';

import { requireRole, toErrorResponse } from '@/lib/auth/account';
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMITS,
} from '@/lib/rate-limit';

export const CONFIRMATION_PHRASE = 'ARCHIVAR Y REINICIAR';

async function archiveWithoutRpc(
  supabase: Awaited<ReturnType<typeof requireRole>>['supabase'],
  accountId: string
) {
  const [conversations, deals] = await Promise.all([
    supabase
      .from('conversations')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('account_id', accountId)
      .in('status', ['open', 'pending'])
      .select('id'),
    supabase
      .from('deals')
      .update({ status: 'lost', updated_at: new Date().toISOString() })
      .eq('account_id', accountId)
      .eq('status', 'open')
      .select('id'),
  ]);

  if (conversations.error || deals.error) {
    console.error('[POST archive-sales-workspace] fallback error:', {
      conversations: conversations.error,
      deals: deals.error,
    });
    throw new Error('workspace archive fallback failed');
  }

  return {
    conversations: conversations.data?.length ?? 0,
    deals: deals.data?.length ?? 0,
  };
}

export async function GET() {
  try {
    const ctx = await requireRole('admin');

    const [conversations, deals] = await Promise.all([
      ctx.supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', ctx.accountId)
        .in('status', ['open', 'pending']),
      ctx.supabase
        .from('deals')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', ctx.accountId)
        .eq('status', 'open'),
    ]);

    if (conversations.error || deals.error) {
      console.error('[GET archive-sales-workspace] preview error:', {
        conversations: conversations.error,
        deals: deals.error,
      });
      return NextResponse.json(
        { error: 'No se pudo preparar la vista previa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversations: conversations.count ?? 0,
      deals: deals.count ?? 0,
      confirmationPhrase: CONFIRMATION_PHRASE,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireRole('admin');
    const limit = checkRateLimit(
      `admin:archive-sales-workspace:${ctx.userId}`,
      { limit: 3, windowMs: RATE_LIMITS.adminAction.windowMs }
    );
    if (!limit.success) return rateLimitResponse(limit);

    const body = (await request.json().catch(() => null)) as {
      confirmation?: unknown;
    } | null;
    if (body?.confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        { error: `Escribe exactamente: ${CONFIRMATION_PHRASE}` },
        { status: 400 }
      );
    }

    const { data, error } = await ctx.supabase.rpc('archive_sales_workspace', {
      target_account_id: ctx.accountId,
    });

    if (error && (error.code === 'PGRST202' || error.code === '42883')) {
      const result = await archiveWithoutRpc(ctx.supabase, ctx.accountId);
      return NextResponse.json(result);
    }

    if (error) {
      console.error('[POST archive-sales-workspace] reset error:', error);
      return NextResponse.json(
        { error: 'No se pudo archivar el espacio de ventas' },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      conversations: Number(result?.conversations_archived ?? 0),
      deals: Number(result?.deals_archived ?? 0),
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
