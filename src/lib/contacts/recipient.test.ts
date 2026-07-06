import { describe, it, expect } from 'vitest'
import { getRecipientFromContact } from './recipient'

describe('getRecipientFromContact', () => {
  it('returns phone when phone is available and recipient_id is null', () => {
    const result = getRecipientFromContact({ phone: '+1234567890', recipient_id: null })
    expect(result).toBe('+1234567890')
  })

  it('returns phone when both phone and recipient_id are set', () => {
    const result = getRecipientFromContact({
      phone: '+1234567890',
      recipient_id: 'fb-user-123',
    })
    expect(result).toBe('+1234567890')
  })

  it('returns recipient_id when phone is null', () => {
    const result = getRecipientFromContact({ phone: null, recipient_id: 'ig-user-456' })
    expect(result).toBe('ig-user-456')
  })

  it('returns recipient_id when phone is empty string', () => {
    const result = getRecipientFromContact({ phone: '', recipient_id: 'ig-user-456' })
    expect(result).toBe('ig-user-456')
  })

  it('trims phone before returning', () => {
    const result = getRecipientFromContact({ phone: '  +1234567890  ', recipient_id: null })
    expect(result).toBe('+1234567890')
  })

  it('trims recipient_id before returning', () => {
    const result = getRecipientFromContact({ phone: null, recipient_id: '  ig-user-456  ' })
    expect(result).toBe('ig-user-456')
  })

  it('throws when both phone and recipient_id are null', () => {
    expect(() =>
      getRecipientFromContact({ phone: null, recipient_id: null })
    ).toThrow('Contact has neither phone nor recipient_id')
  })

  it('throws when both phone and recipient_id are empty', () => {
    expect(() =>
      getRecipientFromContact({ phone: '', recipient_id: '' })
    ).toThrow('Contact has neither phone nor recipient_id')
  })
})
