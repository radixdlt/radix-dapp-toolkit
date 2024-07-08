import { describe, it, expect } from 'vitest'
import { isMobile } from './is-mobile'

describe('isMobile', () => {
  it('should return true if userAgent is mobile', () => {
    ;[
      'Mozilla/5.0 (iPad; CPU OS 13_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1',
    ].forEach((userAgent) => {
      expect(isMobile(userAgent)).toBe(true)
    })
  })
})
