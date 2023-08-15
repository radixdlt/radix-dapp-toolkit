import { GumballMachineExampleConfig } from '../integration-tests/GumballMachine/GumballMachineExample'

export const getExample1 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) => `
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("10");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("10") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
TAKE_FROM_WORKTOP Address("${componentAlpha?.entities.gumballToken}") Decimal("1") Bucket("gumball");
CALL_METHOD Address("${accountAlpha}") "try_deposit_or_abort" Bucket("gumball") Enum<0u8>();
CALL_METHOD Address("${accountBravo}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();
`

export const getExample2 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) => `
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("0.5");
CALL_METHOD Address("${accountBravo}") "withdraw" Address("${xrdAddress}") Decimal("0.5");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("1") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
CALL_METHOD Address("${accountAlpha}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();
`

export const getExample3 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) => `
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("5");
CALL_METHOD Address("${accountAlpha}") "withdraw" Address("${xrdAddress}") Decimal("3");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("2") Bucket("Delta");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("2.5") Bucket("Echo");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("3.5") Bucket("Foxtrot");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("Delta");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("1") Bucket("Golf");
CALL_METHOD Address("${accountAlpha}") "try_deposit_batch_or_abort" Array<Bucket>(Bucket("Echo"),Bucket("Foxtrot"));
CALL_METHOD Address("${accountBravo}") "try_deposit_or_abort" Bucket("Golf") Enum<0u8>();
CALL_METHOD Address("${accountAlpha}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();
`
export const getExample4 = (
  _: string,
  { accountAlpha, componentAlpha }: GumballMachineExampleConfig
) => `
  CALL_METHOD Address("${accountAlpha!}") "create_proof_of_amount" Address("${componentAlpha
  ?.entities?.adminBadge!}") Decimal("1");
  CALL_METHOD Address("${componentAlpha?.address!}") "withdraw_earnings";
  CALL_METHOD Address("${accountAlpha!}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();
`

export const getExample5 = (
  xrdAddress: string,
  { accountAlpha, accountBravo, componentAlpha }: GumballMachineExampleConfig
) =>
  `CALL_METHOD Address("${accountBravo}") "withdraw" Address("${xrdAddress}") Decimal("10");
CALL_METHOD Address("${accountAlpha}") "create_proof_of_amount" Address("${componentAlpha?.entities.adminBadge}") Decimal("1");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("5") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "withdraw_earnings" ;
CALL_METHOD Address("${accountAlpha}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();`

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
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("2") Bucket("xrd");
CALL_METHOD Address("${componentAlpha?.address}") "buy_gumball" Bucket("xrd");
TAKE_FROM_WORKTOP Address("${xrdAddress}") Decimal("1") Bucket("restxrd");
CALL_METHOD Address("${componentBravo?.address}") "buy_gumball" Bucket("restxrd");
CALL_METHOD Address("${accountBravo}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();
`
