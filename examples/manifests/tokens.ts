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
    18u8
    Map<String, Enum>(
        "name" => Enum<Metadata::String>("${name}"),                 
        "symbol" => Enum<Metadata::String>("${symbol}"),             
        "description" => Enum<Metadata::String>("${description}"),    
        "icon_url" => Enum<Metadata::String>("${iconUrl}")    
    ) 
    Map<Enum, Tuple>(
      
        Enum<ResourceMethodAuthKey::Withdraw>() => Tuple(Enum<AccessRule::AllowAll>(), Enum<AccessRule::DenyAll>()),
        Enum<ResourceMethodAuthKey::Deposit>() => Tuple(Enum<AccessRule::AllowAll>(), Enum<AccessRule::DenyAll>())
    )
    Decimal("${initialSupply}");

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
  }) => `CREATE_NON_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
    Enum<NonFungibleIdType::Integer>()
    Tuple(Tuple(Array<Enum>(), Array<Tuple>(), Array<Enum>()), Enum<0u8>(64u8), Array<String>())
    Map<String, Enum>(
        "name" => Enum<Metadata::String>("${name}"),                                        
        "description" => Enum<Metadata::String>("${description}"),                           
        "icon_url" => Enum<Metadata::String>("${iconUrl}")                           
    )
    Map<Enum, Tuple>(
        Enum<ResourceMethodAuthKey::Withdraw>() => Tuple(Enum<AccessRule::AllowAll>(), Enum<AccessRule::DenyAll>()),
        Enum<ResourceMethodAuthKey::Deposit>() => Tuple(Enum<AccessRule::AllowAll>(), Enum<AccessRule::DenyAll>())
    )

    Map<NonFungibleLocalId, Tuple>(
        ${items
          .map(
            (item, index) =>
              `NonFungibleLocalId("#${index + 1}#") => Tuple(Tuple("${item}", Decimal("${index}")))`
          )
          .join(', ')}
        
    );

CALL_METHOD
  Address("${address}") 
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");`,
})
