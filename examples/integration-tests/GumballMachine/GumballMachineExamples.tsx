import * as React from 'react'
import { useGumballMachineState } from '../state'
import { GumballMachineExample } from './GumballMachineExample'
import {
  getExample1,
  getExample2,
  getExample3,
  getExample4,
  getExample5,
  getExample6,
} from '../../manifests/examples'

export const GumballMachineExamples = () => {
  const { components } = useGumballMachineState()
  if (!components.length) return null
  return [
    [
      getExample1,
      `1) Withdraw 10 XRD from Alpha
2) Create bucket of 10 XRD
3) Call buy_gumball with bucket
4) Create bucket of 1 gumball (need resource address!)
5) Deposit gumball bucket to Alpha
6) Deposit entire worktop to Bravo`,
    ],
    [
      getExample2,
      `1) Withdraw 0.5 XRD from Alpha
2) Withdraw 0.5 XRD from Bravo
3) Create bucket of 1 XRD
4) Call buy_gumball with bucket
5) Deposit entire worktop to Alpha`,
    ],
    [
      getExample3,
      `1) Withdraw 5 XRD from Alpha
2) Withdraw 3 XRD from Alpha
3) Create bucket “Delta” of 2 XRD
4) Create bucket “Echo” of 2.5 XRD
5) Create bucket “Foxtrot” of 3.5 XRD
6) Call buy_gumball with bucket Delta
7) Create bucket “Golf” of 1 XRD
8) Call deposit_batch on Alpha with buckets Echo, Foxtrot
9) Call deposit on Charlie with bucket Golf
10) Deposit entire worktop to Alpha`,
    ],
    [
      getExample4,
      `1) Create proof of admin badge from Alpha
2) Call NYI withdraw_funds
a) Deposit entire worktop to Alpha`,
    ],
    [
      getExample5,
      `1) Withdraw 10 XRD from Bravo
2) Create proof of admin badge from Alpha
3) Create bucket of 5 XRD
4) Call buy_gumball with bucket
5) Call withdraw_funds
6) Deposit entire worktop to Alpha`,
    ],
    [
      getExample6,
      `Instantiate another gumball machine prior to this scenario, again assuming price of 1

1) Withdraw 2 XRD from Alpha
2) Create bucket of 2 XRD
3) Call buy_gumball on machine A with bucket
4) Create bucket of all XRD
5) Call buy_gumball on machine B with bucket
6) Deposit entire worktop to Bravo`,
    ],
  ].map(([fn, description]: any, index) => (
    <GumballMachineExample
      key={index}
      title={`Gumball Machine Example ${index + 1}`}
      description={description}
      transactionManifest={fn(gumballMachineState!)}
    />
  ))
}
