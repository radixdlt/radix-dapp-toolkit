import { join } from 'path'
import { readFileSync } from 'fs'
import { hash } from './hash'

describe('hash', () => {
  it('should blake hash', () => {
    const gumballMachineWasm = readFileSync(
      join(__dirname, '../assets/gumball_machine.wasm')
    ).toString('hex')
    expect(hash(gumballMachineWasm).toString('hex')).toBe(
      '101137c37887f5310cd3b5f23c2f8546599f5b6fc1752eb775c92c39c1d3d9c2'
    )
  })
})
