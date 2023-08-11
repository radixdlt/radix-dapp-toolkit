export type StandardMetadata = {
  type: 'fungible' | 'nonFungible' | 'account' | 'component'
  address: string
  name?: string
  symbol?: string
  description?: string
  tags?: string
  icon_url?: string
  info_url?: string
}

export const createMetadataManifest = (metadata: StandardMetadata) => {
  let manifest = ``
  console.log(metadata)

  if (metadata.name) {
    manifest += `SET_METADATA Address("${metadata.address}") "name" Enum<Metadata::String>("${metadata.name}");`
  }

  if (metadata.symbol) {
    manifest += `SET_METADATA Address("${metadata.address}") "symbol" Enum<Metadata::String>("${metadata.symbol}");`
  }

  if (metadata.description) {
    manifest += `SET_METADATA Address("${metadata.address}") "description" Enum<Metadata::String>("${metadata.description}");`
  }

  if (metadata.tags) {
    manifest += `SET_METADATA Address("${
      metadata.address
    }") "tags" Enum<Metadata::StringArray>(Array<String>(${metadata.tags
      .split(',')
      .map((tag) => `"${tag}"`)
      .join(',')}));`
  }

  if (metadata.icon_url) {
    manifest += `SET_METADATA Address("${metadata.address}") "icon_url" Enum<Metadata::Url>("${metadata.icon_url}");`
  }

  if (metadata.info_url) {
    manifest += `SET_METADATA Address("${metadata.address}") "info_url" Enum<Metadata::Url>("${metadata.info_url}");`
  }

  return manifest
}
