import { describe, expect, it } from 'vitest'
import { generateRolaChallenge } from './generate-rola-challenge'

describe('generateRolaChallenge', () => {
  it('should generate valid string', () => {
    const challenge = generateRolaChallenge()
    expect(challenge).toMatch(/^[0-9a-f]{64}$/)
  })
})
