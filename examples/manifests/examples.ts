import { ManifestValue, ManifestBuilder } from '@radixdlt/wallet-sdk'
import { GumballMachineExampleConfig } from '../integration-tests/GumballMachine/GumballMachineExample'

export const getExample1 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) => `
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("10");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("10") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${componentAlpha?.entities.gumballToken}") Bucket("gumball");
CALL_METHOD Address("${accountAlpha}") "deposit" Bucket("gumball");
CALL_METHOD Address("${accountBravo}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`

export const getExample2 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) => `
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("0.5");
CALL_METHOD Address("${accountBravo}") "withdraw" Address("${xrdAddress}") Decimal("0.5");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
CALL_METHOD Address("${accountAlpha}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`

export const getExample3 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) => `
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("5");
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("3");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("2") Address("${xrdAddress}") Bucket("Delta");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("2.5") Address("${xrdAddress}") Bucket("Echo");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("3.5") Address("${xrdAddress}") Bucket("Foxtrot");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("Delta");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${xrdAddress}") Bucket("Golf");
CALL_METHOD Address("${accountAlpha}") "deposit_batch" Array<Bucket>(Bucket("Echo"),Bucket("Foxtrot"));
CALL_METHOD Address("${accountBravo}") "deposit" Bucket("Golf");
CALL_METHOD Address("${accountAlpha}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`
export const getExample4 = (
  _: string,
  { accountAlpha, componentAlpha }: GumballMachineExampleConfig
) =>
  new ManifestBuilder()
    .createProofFromAccount(
      accountAlpha!,
      componentAlpha?.entities?.adminBadge!
    )
    .callMethod(componentAlpha?.address!, 'withdraw_earnings', [])
    .callMethod(accountAlpha!, 'deposit_batch', [
      ManifestValue.Expression('ENTIRE_WORKTOP'),
    ])
    .build()
    .toString()

export const getExample5 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) =>
  `CALL_METHOD Address("${accountBravo}") "withdraw" Address("${xrdAddress}") Decimal("10");
CALL_METHOD Address("${accountAlpha}") "create_proof" Address("${componentAlpha?.entities.adminBadge}");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("5") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "withdraw_earnings" ;
CALL_METHOD Address("${accountAlpha}") "deposit_batch" Expression("ENTIRE_WORKTOP");`

export const getExample6 = (
  xrdAddress: string,
  {
    accountAlpha,
    accountBravo,
    componentAlpha,
    componentBravo,
  }: GumballMachineExampleConfig
) =>
  `
CALL_METHOD Address("${accountAlpha}") "withdraw"  Address("${xrdAddress}") Decimal("2");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("2") Address("${xrdAddress}") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
TAKE_FROM_WORKTOP_BY_AMOUNT Decimal("1") Address("${xrdAddress}") Bucket("restxrd");
CALL_METHOD Address("${componentBravo?.address}") "buy_gumball" Bucket("restxrd");
CALL_METHOD Address("${accountBravo}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`
