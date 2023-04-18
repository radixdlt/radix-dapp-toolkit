import { Bucket, Expression, ManifestBuilder } from '@radixdlt/wallet-sdk'

export type ExampleOptions = {
  accountA: string
  accountB: string
  accountC: string
  xrdAddress: string
  gumballMachineComponentAddress: string
  gumballMachineComponent2Address: string
  gumballResourceAddress: string
  adminBadgeAddress: string
}

export const getExample1 = ({
  accountA,
  accountB,
  xrdAddress,
  gumballMachineComponentAddress,
  gumballResourceAddress,
}: ExampleOptions) => `
CALL_METHOD Address("${accountA}") "withdraw" Address("${xrdAddress}") Decimal("10");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("10") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${gumballMachineComponentAddress}") "buy_gumball" Bucket("xrd");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${gumballResourceAddress}") Bucket("gumball");
CALL_METHOD Address("${accountA}") "deposit" Bucket("gumball");
CALL_METHOD Address("${accountB}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`

export const getExample2 = ({
  accountA,
  accountB,
  xrdAddress,
  gumballMachineComponentAddress,
}: ExampleOptions) => `
CALL_METHOD Address("${accountA}") "withdraw" Address("${xrdAddress}") Decimal("0.5");
CALL_METHOD Address("${accountB}") "withdraw" Address("${xrdAddress}") Decimal("0.5");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${gumballMachineComponentAddress}") "buy_gumball" Bucket("xrd");
CALL_METHOD Address("${accountA}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`

export const getExample3 = ({
  accountA,
  accountC,
  xrdAddress,
  gumballMachineComponentAddress,
}: ExampleOptions) => `
CALL_METHOD Address("${accountA}") "withdraw" Address("${xrdAddress}") Decimal("5");
CALL_METHOD Address("${accountA}") "withdraw" Address("${xrdAddress}") Decimal("3");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("2") Address("${xrdAddress}") Bucket("Delta");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("2.5") Address("${xrdAddress}") Bucket("Echo");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("3.5") Address("${xrdAddress}") Bucket("Foxtrot");
CALL_METHOD Address("${gumballMachineComponentAddress}") "buy_gumball" Bucket("Delta");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${xrdAddress}") Bucket("Golf");
CALL_METHOD Address("${accountA}") "deposit_batch" Array<Bucket>(Bucket("Echo"),Bucket("Foxtrot"));
CALL_METHOD Address("${accountC}") "deposit" Bucket("Golf");
CALL_METHOD Address("${accountA}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`
export const getExample4 = ({
  accountA,
  gumballMachineComponentAddress,
  adminBadgeAddress,
}: ExampleOptions) =>
  new ManifestBuilder()
    .createProofFromAccount(accountA, adminBadgeAddress)
    .callMethod(gumballMachineComponentAddress, 'withdraw_earnings', [])
    .callMethod(accountA, 'deposit_batch', [Expression('ENTIRE_WORKTOP')])
    .build()
    .toString()

export const getExample5 = ({
  accountA,
  accountB,
  xrdAddress,
  gumballMachineComponentAddress,
  adminBadgeAddress,
}: ExampleOptions) =>
  `CALL_METHOD Address("${accountB}") "withdraw" Address("${xrdAddress}") Decimal("10");
CALL_METHOD Address("${accountA}") "create_proof" Address("${adminBadgeAddress}");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("5") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${gumballMachineComponentAddress}") "buy_gumball" Bucket("xrd");
CALL_METHOD Address("${gumballMachineComponentAddress}") "withdraw_earnings" ;
CALL_METHOD Address("${accountA}") "deposit_batch" Expression("ENTIRE_WORKTOP");`

export const getExample6 = ({
  accountA,
  accountB,
  accountC,
  xrdAddress,
  gumballMachineComponentAddress,
  gumballMachineComponent2Address,
}: ExampleOptions) =>
  `
CALL_METHOD Address("${accountA}") "withdraw"  Address("${xrdAddress}") Decimal("2");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("2") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${gumballMachineComponentAddress}") "buy_gumball" Bucket("xrd");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${xrdAddress}") Bucket("restxrd");
CALL_METHOD Address("${gumballMachineComponent2Address}") "buy_gumball" Bucket("restxrd");
CALL_METHOD Address("${accountB}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`
