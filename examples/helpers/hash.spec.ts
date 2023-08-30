import { join } from 'path'
import { readFileSync } from 'fs'
import { hash } from './hash'

describe('hash', () => {
  it('should blake hash', () => {
    const gumballMachineWasm = readFileSync(
      join(__dirname, '../assets/gumball_machine.wasm')
    ).toString('hex')
    expect(hash(gumballMachineWasm).toString('hex')).toBe(
      'a6eab9a9bf73b2beeeabb37b57fac4f83b59528ac2e59d3a84e3c932d9d8b5c1'
    )
  })
})
