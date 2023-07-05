import {
  GumballMachineComponentState,
} from '../integration-tests/state'

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
      staffBadge: '',
      gumballToken: '',
    },
  }
) => {
  const setRelatedEntities = () => `
    SET_METADATA Address("${ownerAccountAddress}") "claimed_entities" Enum(1u8, Array<Enum>(
      Enum(0u8, "${entities.adminBadge}"),
      Enum(0u8, "${entities.staffBadge}"),
      Enum(0u8, "${entities.gumballToken}"),
      Enum(0u8, "${gumballMachineComponentAddress}")
    ));
  `

  const setPrice = (
    price: number
  ) => `CALL_METHOD Address("${ownerAccountAddress}") "create_proof" Address("${entities.adminBadge}");
CALL_METHOD Address("${gumballMachineComponentAddress}") "set_price" Decimal("${price}");
CALL_METHOD Address("${ownerAccountAddress}") "deposit_batch" Expression("ENTIRE_WORKTOP");`
  return { setPrice, setRelatedEntities }
}
