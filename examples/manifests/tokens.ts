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
            "name" => Tuple(
                Some(Enum<Metadata::String>("${name}")),    # Resource Name
                true                                                         # Locked
            ),
            "symbol" => Tuple(
                Some(Enum<Metadata::String>("${symbol}")),   
                true                                                        
            ),
            "description" => Tuple(
                Some(Enum<Metadata::String>("${description}")),   
                true                                                        
            ),
            "icon_url" => Tuple(
              Some(Enum<Metadata::String>("${iconUrl}")),
              true
            )
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
    items: string[]
  }) => `
  # Creating a new resource 
CREATE_NON_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
    # Owner role - This gets metadata permissions, and is the default for other permissions
    # Can set as Enum<OwnerRole::Fixed>(access_rule)  or Enum<OwnerRole::Updatable>(access_rule)
    Enum<OwnerRole::None>()
    Enum<NonFungibleIdType::Integer>()                                                                  # The type of NonFungible Id
    true                                                                                                # Whether the engine should track supply (avoid for massively parallelizable tokens)
    Tuple(Tuple(Array<Enum>(), Array<Tuple>(), Array<Enum>()), Enum<0u8>(66u8), Array<String>())        # Non Fungible Data Schema
    Map<NonFungibleLocalId, Tuple>(   
        ${items
          .map(
            (item, index) =>
              `NonFungibleLocalId("#${index + 1}#") => Tuple(Tuple())`
          )
          .join(
            ', '
          )}                                                                 
    )
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
        None,        # Deposit Roles (if None: defaults to AllowAll, DenyAll)
        None         # Non Fungible Data Update Roles (if None: defaults to DenyAll, DenyAll)
    )
    Tuple(                                                                   # Metadata initialization
        Map<String, Tuple>(                                                  # Initial metadata values
            "name" => Tuple(
                Some(Enum<Metadata::String>("${name}")),    
                true                                                         
            ),
            "description" => Tuple(
                Some(Enum<Metadata::String>("${description}")),    
                true   
            ),
            "icon_url" => Tuple(
                Some(Enum<Metadata::String>("${iconUrl}")),    
                true   
            ) 
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
    Expression("ENTIRE_WORKTOP");
  `,
})
