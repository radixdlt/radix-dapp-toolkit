import { hash } from '../helpers/hash'

export const getDeployPackageManifest = ({
  wasm,
  schema,
  nftAddress,
}: {
  wasm: string
  schema: string
  nftAddress: string
}) => {
  const wasmHash = hash(wasm).toString('hex')
  return `
    PUBLISH_PACKAGE_ADVANCED
    None
    Blob("${wasmHash}") 
    ${schema}
    Map<String, Tuple>()      
    Map<String, Enum>()  
    Map<Enum, Tuple>();    
    `
}
