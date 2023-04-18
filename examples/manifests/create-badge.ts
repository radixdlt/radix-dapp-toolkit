export const getCreateBadgeManifest = (accountAddress: string) => `
  CREATE_NON_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
    Enum("NonFungibleIdType::Integer")
    Tuple(Tuple(Array<Enum>(), Array<Tuple>(), Array<Enum>()), Enum(0u8, 64u8), Array<String>())
    Map<String, String>(
        "name", "My Package Owner Badge",
        "description", "This NFT was created by the Radix Dashboard as a simple badge to be used for default package control permissions. There is nothing special about it - swap it out, or create your own"
    )
    Map<Enum, Tuple>(
        Enum("ResourceMethodAuthKey::Withdraw"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll")),
        Enum("ResourceMethodAuthKey::Deposit"), Tuple(Enum("AccessRule::AllowAll"), Enum("AccessRule::DenyAll"))
    )
    Map<NonFungibleLocalId, Tuple>(
        NonFungibleLocalId("#1#"),
        Tuple(Tuple("Hello World", Decimal("12")))
    );

CALL_METHOD
    Address("${accountAddress}") 
    "deposit_batch"
    Expression("ENTIRE_WORKTOP");
`
