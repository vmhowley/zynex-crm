from pathlib import Path

path = Path('src/app/api/whatsapp/webhook/route.ts')
text = path.read_text()

imp = "import { dispatchInboundToAiReply } from '@/lib/ai/auto-reply'\n"
if text.count(imp) != 1:
    raise SystemExit(f'AI import: expected 1 match, found {text.count(imp)}')
text = text.replace(imp, '', 1)

start = """  // AI auto-reply. Runs only for plain-text inbound the deterministic
  // flow runner did NOT consume (flows win over the LLM), and only when
  // the account has enabled it. Awaited inside `after()` (same reason as
  // the webhook dispatch below); `dispatchInboundToAiReply` owns its
  // eligibility gates + try/catch and never throws.
  if (!flowConsumed && !interactiveReplyId && inboundText.trim()) {
    await dispatchInboundToAiReply({
      accountId,
      conversationId: conversation.id,
      contactId: contactRecord.id,
      configOwnerUserId,
    })
  }

"""
if text.count(start) != 1:
    raise SystemExit(f'AI auto-reply block: expected 1 match, found {text.count(start)}')
text = text.replace(start, '', 1)

path.write_text(text)
