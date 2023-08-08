import { join } from 'path'
import { readFileSync } from 'fs'
import { hash } from './hash'

describe('hash', () => {
  it('should blake hash', () => {
    const gumballMachineWasm = readFileSync(
      join(__dirname, '../assets/gumball_machine.wasm')
    ).toString('hex')
    expect(hash(gumballMachineWasm).toString('hex')).toBe(
      '0ee930dc59854bfdfe0d638b3f794c9983dddc7197cb01d2b6275042ddb9bf27'
    )
  })
})
