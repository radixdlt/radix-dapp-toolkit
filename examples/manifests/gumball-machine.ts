import { GumballMachineState } from '../integration-tests/state'

export const GumballMachineTransactionManifests = ({
  accountA,
  adminBadgeAddress,
  gumballMachineComponentAddress,
}: GumballMachineState) => {
  const setPrice = (
    price: number
  ) => `CALL_METHOD Address("${accountA}") "create_proof" Address("${adminBadgeAddress}");
CALL_METHOD Address("${gumballMachineComponentAddress}") "set_price" Decimal("${price}");
CALL_METHOD Address("${accountA}") "deposit_batch" Expression("ENTIRE_WORKTOP");`
  return { setPrice }
}
