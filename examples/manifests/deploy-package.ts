import { hash } from '../helpers/hash'

export const getDeployPackageManifest = ({
  wasm,
  rpd,
  nftAddress,
}: {
  wasm: string
  rpd: string
  nftAddress: string
}) => {
  const wasmHash = hash(wasm).toString('hex')
  return `
    PUBLISH_PACKAGE_ADVANCED
    Enum<AccessRule::AllowAll>() # Owner AccessRule
    ${rpd}
    Blob("${wasmHash}")    # Package Code
    Map<String, Tuple>()         # Metadata
    None;                        # Address Reservation`
}
