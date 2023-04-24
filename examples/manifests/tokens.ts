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
  Map<NonFungibleLocalId, Tuple>(${[
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-large.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-large.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-medium.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Filling+Station+Breakfast-small.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame 6-large.png',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame 6-medium.png',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Frame 6-small.png',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried Kway Teow-large.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried Kway Teow-medium.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/Fried Kway Teow-small.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/ICON-transparency.png',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-large.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-medium.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/KL Haze-small.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano-2.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano-3.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/modern_kunst_museum_pano.jpg',
    'https://image-service-test-images.s3.eu-west-2.amazonaws.com/wallet_test_images/scryptonaut_patch.svg',
  ]
    .map(
      (item, index) =>
        `NonFungibleLocalId("#${
          index + 1
        }#"), Tuple(Tuple("${item}", Decimal("${index}")))`
    )
    .join(', ')}
  );

CALL_METHOD
  Address("${address}") 
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");`,
})
