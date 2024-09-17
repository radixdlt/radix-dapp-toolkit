import { describe, expect, it } from 'vitest'
import { validateRolaChallenge } from './validate-rola-challenge'

describe('validateRolaChallenge', () => {
  const validTestVectors = [
    '3f30f8d67ca69af8b646170d6ddd0a16cb501dcb7d457d0b49ef78a5d1b4beac',
    '0a6a5b8beac0e56b8613f1b1a08223b3986aa28b9acc81d16493c75a428f436e',
    '2455077b5bb93e1d5c9816513c3385b88293d91b9d44ed6bd652764834eb997a',
  ]

  const invalidTestVectors = [
    'abc',
    '',
    undefined,
    null,
    {},
    '3f30f8d67ca69af8b646170d6ddd0a16cb501dcb7d457d0b49ef78a5d1b4beacz',
  ]

  it('should return true for valid challenge', () => {
    validTestVectors.forEach((challenge) => {
      expect(validateRolaChallenge(challenge)).toBe(true)
    })
  })

  it('should return false for invalid challenge', () => {
    invalidTestVectors.forEach((challenge) => {
      expect(validateRolaChallenge(challenge)).toBe(false)
    })
  })
})
