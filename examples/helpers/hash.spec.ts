import { join } from 'path'
import { readFileSync } from 'fs'
import { hash } from './hash'

describe('hash', () => {
  it('should blake hash', () => {
    const gumballMachineWasm = readFileSync(
      join(__dirname, '../assets/gumball_machine.wasm')
    ).toString('hex')
    expect(hash(gumballMachineWasm).toString('hex')).toBe(
      '56175fdef9c045a93b5453829744ec5b9614c2728dd0b4b7d5dd9f00b47023a9'
    )
  })
})
