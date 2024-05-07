import { safeParse } from 'valibot'
import { Proof } from '../schemas'

export const parseRolaProof = (proof: Proof) => safeParse(Proof, proof)
