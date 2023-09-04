import { GumballMachineComponentState } from '../integration-tests/state'

export const GumballMachineTransactionManifests = (
  {
    ownerAccountAddress,
    entities,
    address: gumballMachineComponentAddress,
  }: GumballMachineComponentState = {
    address: '',
    ownerAccountAddress: '',
    gumballFlavour: '',
    gumballPrice: 0,
    entities: {
      dApp: '',
      adminBadge: '',
      gumballToken: '',
    },
  }
) => {
  const setPrice = (
    price: number
  ) => `CALL_METHOD Address("${ownerAccountAddress}") "create_proof_of_amount" Address("${entities.adminBadge}") Decimal("1");
CALL_METHOD Address("${gumballMachineComponentAddress}") "set_price" Decimal("${price}");
CALL_METHOD Address("${ownerAccountAddress}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();`
  return { setPrice }
}
