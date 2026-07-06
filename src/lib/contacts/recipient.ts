/**
 * Resolve the Meta API `to` field from a contact record.
 *
 * WhatsApp contacts are addressed by E.164 phone number.
 * Instagram/Messenger contacts are addressed by an opaque platform
 * user ID (recipient_id). This helper returns whichever is available,
 * preferring phone when both are set.
 *
 * @throws {Error} if the contact has neither phone nor recipient_id.
 */
export function getRecipientFromContact(contact: {
  phone: string | null
  recipient_id: string | null
}): string {
  if (contact.phone?.trim()) return contact.phone.trim()
  if (contact.recipient_id?.trim()) return contact.recipient_id.trim()
  throw new Error('Contact has neither phone nor recipient_id')
}
