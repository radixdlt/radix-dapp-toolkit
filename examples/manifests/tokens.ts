export const createToken = (address: string) => ({
  fungible: ({
    name,
    symbol,
    description,
    icon_url,
  }: Partial<{
    icon_url: string
    name: string
    description: string
    symbol: string
  }>) => `CREATE_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
  18u8
  Map<String, String>(
      "name", "${name}", 
      "symbol", "${symbol}", 
      "description", "${description}",
      "icon_url", "${icon_url}"
  ) 
  Map<Enum, Tuple>(
      Enum("ResourceMethodAuthKey::Withdraw"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll")),
      Enum("ResourceMethodAuthKey::Deposit"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll"))
  )
  Decimal("10");

# Depositing the entirety of the initial supply of the newly created resource into our account 
# component.
CALL_METHOD
  Address("${address}") 
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");`,
  nft: ({
    name,
    description,
    icon_url,
  }: Partial<{
    icon_url: string
    name: string
    description: string
  }>) => `CREATE_NON_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
  Enum("NonFungibleIdType::Integer")
  Tuple(Tuple(Array<Enum>(), Array<Tuple>(), Array<Enum>()), Enum(0u8, 64u8), Array<String>())
  Map<String, String>(
    "name", "${name}", 
    "description", "${description}",
    "icon_url", "${icon_url}"
  )
  Map<Enum, Tuple>(
      Enum("ResourceMethodAuthKey::Withdraw"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll")),
      Enum("ResourceMethodAuthKey::Deposit"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll"))
  )
  Map<NonFungibleLocalId, Tuple>(
      NonFungibleLocalId("#2#"),
      Tuple(Tuple("https://c4.wallpaperflare.com/wallpaper/817/534/563/ave-bosque-fantasia-fenix-wallpaper-preview.jpg", Decimal("2"))),
      NonFungibleLocalId("#1#"),
      Tuple(Tuple("https://c4.wallpaperflare.com/wallpaper/817/534/563/ave-bosque-fantasia-fenix-wallpaper-preview.jpg", Decimal("1")))
  );

CALL_METHOD
  Address("${address}") 
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");`,
})
