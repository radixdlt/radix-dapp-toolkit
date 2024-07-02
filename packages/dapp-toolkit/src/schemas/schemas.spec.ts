import { describe, it, expect } from 'vitest'
import {
  AccountsRequestResponseItem,
  LoginRequestResponseItem,
  OfferIO,
} from '.'
import { parse } from 'valibot'

describe('schemas', () => {
  describe('AccountsRequestResponseItem', () => {
    it('should parse valid schema', () => {
      const result = parse(AccountsRequestResponseItem, {
        accounts: [],
      })

      expect(result).toEqual({
        accounts: [],
      })
    })

    it('should return message for invalid schema', () => {
      try {
        parse(AccountsRequestResponseItem, {
          accounts: [],
          challenge: 'abc',
          proofs: [],
        })
      } catch (e: any) {
        expect(e.message).toBe('missing challenge or proofs')
      }
    })
  })

  describe('LoginRequestResponseItem', () => {
    it('should parse valid schema', () => {
      const result = parse(LoginRequestResponseItem, {
        persona: {
          identityAddress: 'a',
          label: 'a',
        },
      })

      expect(result).toEqual({
        persona: {
          identityAddress: 'a',
          label: 'a',
        },
      })
    })

    it('should return message for invalid schema', () => {
      try {
        parse(LoginRequestResponseItem, {
          persona: {
            identityAddress: 'a',
            label: 'a',
          },
          challenge: 'abc',
        })
      } catch (e: any) {
        expect(e.message).toBe('missing challenge or proof')
      }
    })
  })

  describe('OfferIO', () => {
    it('should parse valid schema', () => {
      const value = {
        requestId: 'abc',
        targetClientId: 'ab',
        encryptedPayload: 'ab',
        method: 'offer',
        payload: {
          sdp: 'a',
        },
      }
      const result = parse(OfferIO, value)

      expect(result).toEqual(value)
    })
  })
})
