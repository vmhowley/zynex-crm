import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/automations/admin-client'
import { runAutomationsForTrigger } from '@/lib/automations/engine'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { contact_id, tag_id, action } = body

    if (!contact_id || !tag_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action !== 'add' && action !== 'remove') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const admin = supabaseAdmin()

    // Get account_id for this user
    const { data: profile } = await admin
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 403 })
    }

    const accountId = profile.account_id

    // Verify contact belongs to this account
    const { data: contact } = await admin
      .from('contacts')
      .select('id')
      .eq('id', contact_id)
      .eq('account_id', accountId)
      .single()

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (action === 'add') {
      // Insert tag
      const { error } = await admin
        .from('contact_tags')
        .insert({ contact_id, tag_id })

      if (error) {
        console.error('[contacts/tags] insert error:', error)
        return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
      }

      // Dispatch tag_added automation trigger
      runAutomationsForTrigger({
        accountId,
        triggerType: 'tag_added',
        contactId: contact_id,
        context: { tag_id },
      }).catch((err) => console.error('[automations] tag_added dispatch failed:', err))

    } else {
      // Remove tag
      const { error } = await admin
        .from('contact_tags')
        .delete()
        .eq('contact_id', contact_id)
        .eq('tag_id', tag_id)

      if (error) {
        console.error('[contacts/tags] delete error:', error)
        return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contacts/tags] error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
