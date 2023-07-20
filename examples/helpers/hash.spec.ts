import { join } from 'path'
import { readFileSync } from 'fs'
import { hash } from './hash'

describe('hash', () => {
  it('should blake hash', () => {
    const gumballMachineWasm = readFileSync(
      join(__dirname, '../assets/gumball_machine.wasm')
    ).toString('hex')
    expect(hash(gumballMachineWasm).toString('hex')).toBe(
      'c41a33c9ee09038cae78801ac1c70db5192da199c944a326a9df2afc95f50805'
    )
  })
})
