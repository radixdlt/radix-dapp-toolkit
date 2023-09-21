export const createToken = (address: string) => ({
  fungible: ({
    name,
    symbol,
    description,
    iconUrl,
    initialSupply,
  }: Partial<{
    iconUrl: string
    name: string
    description: string
    symbol: string
    initialSupply: number
  }>) => `CREATE_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
    # Owner role - This gets metadata permissions, and is the default for other permissions
    # Can set as Enum<OwnerRole::Fixed>(access_rule)  or Enum<OwnerRole::Updatable>(access_rule)
    Enum<OwnerRole::None>()
    true             # Whether the engine should track supply (avoid for massively parallelizable tokens)
    18u8             # Divisibility (between 0u8 and 18u8)
    Decimal("${initialSupply}") # Initial supply
    Tuple(
        Some(         # Mint Roles (if None: defaults to DenyAll, DenyAll)
            Tuple(
                Some(Enum<AccessRule::AllowAll>()),  # Minter (if None: defaults to Owner)
                Some(Enum<AccessRule::DenyAll>())    # Minter Updater (if None: defaults to Owner)
            )
        ),
        None,        # Burn Roles (if None: defaults to DenyAll, DenyAll)
        None,        # Freeze Roles (if None: defaults to DenyAll, DenyAll)
        None,        # Recall Roles (if None: defaults to DenyAll, DenyAll)
        None,        # Withdraw Roles (if None: defaults to AllowAll, DenyAll)
        None         # Deposit Roles (if None: defaults to AllowAll, DenyAll)
    )
    Tuple(                                                                   # Metadata initialization
        Map<String, Tuple>(                                                  # Initial metadata values
            ${[
              { key: 'name', value: name, type: 'String' },
              {
                key: 'symbol',
                value: symbol,
                type: 'String',
              },
              { key: 'description', value: description, type: 'String' },
              { key: 'icon_url', value: iconUrl, type: 'Url' },
            ]
              .filter(({ value }) => Boolean(value))
              .map(
                ({ key, value, type }) => `"${key}" => Tuple(
                Some(Enum<Metadata::${type}>("${value}")),    # Resource Name
                true                                                         # Locked
            )`
              )
              .join(', ')}
        ),
        Map<String, Enum>(                                                   # Metadata roles
            "metadata_setter" => Some(Enum<AccessRule::AllowAll>()),         # Metadata setter role
            "metadata_setter_updater" => None,                               # Metadata setter updater role as None defaults to OWNER
            "metadata_locker" => Some(Enum<AccessRule::DenyAll>()),          # Metadata locker role
            "metadata_locker_updater" => None                                # Metadata locker updater role as None defaults to OWNER
        )
    )
    None;             # No Address Reservation

# Depositing the entirety of the initial supply of the newly created resource into our account 
# component.
CALL_METHOD
    Address("${address}") 
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");`,
  nft: ({
    name,
    description,
    iconUrl,
    items,
  }: {
    iconUrl: string
    name: string
    description: string
    items: { name: string; description: string; value: string }[]
  }) => `
  CREATE_NON_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
    Enum<0u8>()
    Enum<1u8>()
    true
    Enum<0u8>(
        Enum<0u8>(
            Tuple(
                Array<Enum>(
                    Enum<14u8>(
                        Array<Enum>(
                            Enum<0u8>(
                                12u8
                            ),
                            Enum<0u8>(
                                12u8
                            ),
                            Enum<0u8>(
                                198u8
                            ),
                            Enum<0u8>(
                                10u8
                            )
                        )
                    )
                ),
                Array<Tuple>(
                    Tuple(
                        Enum<1u8>(
                            "MetadataStandardNonFungibleData"
                        ),
                        Enum<1u8>(
                            Enum<0u8>(
                                Array<String>(
                                    "name",
                                    "description",
                                    "key_image_url",
                                    "arbitrary_coolness_rating"
                                )
                            )
                        )
                    )
                ),
                Array<Enum>(
                    Enum<0u8>()
                )
            )
        ),
        Enum<1u8>(
            0u64
        ),
        Array<String>()
    )
    Map<NonFungibleLocalId, Tuple>(
        ${items
          .map(({ name, description, value }, index) => {
            return `NonFungibleLocalId("#${index}#") => Tuple(
            Tuple(
                "${name}",
                "${description}",
                "${value}",
                45u64
            )
        )`
          })
          .join(',')}
    )
    Tuple(
        Enum<0u8>(),
        Enum<0u8>(),
        Enum<0u8>(),
        Enum<0u8>(),
        Enum<0u8>(),
        Enum<0u8>(),
        Enum<0u8>()
    )
    Tuple(
        Map<String, Tuple>(
            "description" => Tuple(
                Enum<1u8>(
                    Enum<0u8>(
                        "${description}"
                    )
                ),
                true
            ),
            "icon_url" => Tuple(
                Enum<1u8>(
                    Enum<13u8>(
                        "${iconUrl}"
                    )
                ),
                true
            ),
            "info_url" => Tuple(
                Enum<1u8>(
                    Enum<13u8>(
                        "https://developers.radixdlt.com/ecosystem"
                    )
                ),
                true
            ),
            "name" => Tuple(
                Enum<1u8>(
                    Enum<0u8>(
                        "${name}"
                    )
                ),
                true
            ),
            "tags" => Tuple(
                Enum<1u8>(
                    Enum<128u8>(
                        Array<String>(
                            "collection",
                            "sandbox",
                            "example-tag"
                        )
                    )
                ),
                true
            )
        ),
        Map<String, Enum>()
    )
    Enum<0u8>()
;
CALL_METHOD
    Address("${address}")
    "try_deposit_batch_or_abort"
    Expression("ENTIRE_WORKTOP")
    Enum<0u8>()
;`,
})
