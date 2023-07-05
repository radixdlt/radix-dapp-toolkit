export const getCreateBadgeManifest = (accountAddress: string) => `

CREATE_NON_FUNGIBLE_RESOURCE_WITH_INITIAL_SUPPLY
    Enum<NonFungibleIdType::Integer>()
    Tuple(Tuple(Array<Enum>(), Array<Tuple>(), Array<Enum>()), Enum<0u8>(64u8), Array<String>())
    Map<String, Enum>(
        "name" => Enum<Metadata::String>("My Package Owner Badge"),                                     
        "description" => Enum<Metadata::String>("This NFT was created by the Radix Sandbox dApp as a simple badge to be used for default package control permissions.")   
    )
    Map<Enum, Tuple>(
        Enum<ResourceMethodAuthKey::Withdraw>() => Tuple(Enum<AccessRule::AllowAll>(), Enum<AccessRule::DenyAll>()),
        Enum<ResourceMethodAuthKey::Deposit>() => Tuple(Enum<AccessRule::AllowAll>(), Enum<AccessRule::DenyAll>())
    )
    Map<NonFungibleLocalId, Tuple>(
        NonFungibleLocalId("#1#") => 
        Tuple(Tuple("Hello World", Decimal("12")))
    );

CALL_METHOD
    Address("${accountAddress}") 
    "deposit_batch"
    Expression("ENTIRE_WORKTOP"); 
`
