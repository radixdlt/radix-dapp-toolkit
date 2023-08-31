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
      adminBadge: '',
      gumballToken: '',
    },
  }
) => {
  const setPrice = (
    price: number
  ) => `CALL_METHOD Address("${ownerAccountAddress}") "create_proof" Address("${entities.adminBadge}");
CALL_METHOD Address("${gumballMachineComponentAddress}") "set_price" Decimal("${price}");
CALL_METHOD Address("${ownerAccountAddress}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP") Enum<0u8>();`
  return { setPrice }
}
