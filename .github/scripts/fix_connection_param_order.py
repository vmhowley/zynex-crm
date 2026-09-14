from pathlib import Path

path = Path('src/app/api/whatsapp/webhook/route.ts')
text = path.read_text()

old = """  // Channel type: whatsapp, instagram, or messenger
  channel: string = 'whatsapp',
  // Exact tenant connection that received the event.
  channelConfigId: string
"""
new = """  // Channel type: whatsapp, instagram, or messenger
  channel: string,
  // Exact tenant connection that received the event.
  channelConfigId: string
"""
if text.count(old) != 1:
    raise SystemExit(f'processMessage signature: expected 1 match, found {text.count(old)}')
text = text.replace(old, new, 1)

old = """  contactId: string,
  channel: string = 'whatsapp',
  channelConfigId: string
"""
new = """  contactId: string,
  channel: string,
  channelConfigId: string
"""
if text.count(old) != 1:
    raise SystemExit(f'findOrCreateConversation signature: expected 1 match, found {text.count(old)}')
text = text.replace(old, new, 1)

path.write_text(text)
