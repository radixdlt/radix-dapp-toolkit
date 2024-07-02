import { safeParse } from 'valibot'
import { SignedChallenge } from '../modules'

export const parseSignedChallenge = (value: SignedChallenge) =>
  safeParse(SignedChallenge, value)
