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
      gumballToken: '',
    },
  }
) => {
  const setRelatedEntities = () => `
    SET_METADATA
    Address("${ownerAccountAddress}")
    "claimed_entities"
    Enum<Metadata::AddressArray>(
        Array<Address>(
            Address("${entities.adminBadge}"),
            Address("${entities.gumballToken}"),
            Address("${gumballMachineComponentAddress}")
        )
    );
  `

  const setPrice = (
    price: number
  ) => `CALL_METHOD Address("${ownerAccountAddress}") "create_proof" Address("${entities.adminBadge}");
CALL_METHOD Address("${gumballMachineComponentAddress}") "set_price" Decimal("${price}");
CALL_METHOD Address("${ownerAccountAddress}") "try_deposit_batch_or_abort" Expression("ENTIRE_WORKTOP");`
  return { setPrice, setRelatedEntities }
}
