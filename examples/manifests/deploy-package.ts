import { hash } from '../helpers/hash'

export const getDeployPackageManifest = ({
  account,
  wasm,
  rpd,
  nftAddress,
}: {
  account: string
  wasm: string
  rpd: string
  nftAddress: string
}) => {
  const wasmHash = hash(wasm).toString('hex')
  const [nftCollectionAddress, nftId] = nftAddress.split(':')
  return `
    CALL_METHOD
    Address("${account}")
    "create_proof_of_non_fungibles"
    Address("${nftCollectionAddress}")
    Array<NonFungibleLocalId>(
        NonFungibleLocalId("${nftId}")
    )
;

    PUBLISH_PACKAGE_ADVANCED
    Enum<OwnerRole::Fixed>(     # Owner Role
        Enum<AccessRule::Protected>(
            Enum<AccessRuleNode::ProofRule>(
                Enum<ProofRule::Require>(
                    Enum<0u8>(   # ResourceOrNonFungible::NonFungible
                        NonFungibleGlobalId("${nftAddress}")
                    )
                )
            )
        )
    )
    ${rpd}
    Blob("${wasmHash}")    # Package Code
    Map<String, Tuple>()         # Metadata
    None;                        # Address Reservation`
}

export const getInstantiateGumballMachineManifest = (
  ownerAddress: string,
  gumballPrice: number,
  gumballFlavour: string,
  gumballImage: string,
  gumballMachinePackageAddress: string
) => `
  CALL_FUNCTION Address("${gumballMachinePackageAddress}") "GumballMachine" "instantiate" Decimal("${gumballPrice}") "${gumballFlavour}" "${gumballImage}";
  CALL_METHOD Address("${ownerAddress}") "deposit_batch" Expression("ENTIRE_WORKTOP");
`