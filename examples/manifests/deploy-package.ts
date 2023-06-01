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
    Blob("${wasmHash}") 
    ${schema}
    Map<String, Tuple>()       # Royalty Configuration
    Map<String, String>()      # Metadata 
    Tuple(                     # Access Rules Config Struct
        Map<Tuple, Enum>(),     # Direct Access Method auth Field
        Map<Tuple, Enum>(       # Method auth Field
            Tuple(
                Enum("TypedModuleId::ObjectState"),
                "set_royalty_config"
            ),
            Enum(
                "AccessRuleEntry::AccessRule", 
                Enum(
                    "AccessRule::Protected", 
                    Enum(
                        "AccessRuleNode::ProofRule", 
                        Enum(
                            "ProofRule::Require", 
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible", 
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            ),
            Tuple(
                Enum("TypedModuleId::ObjectState"),
                "claim_royalty"
            ),
            Enum(
                "AccessRuleEntry::AccessRule", 
                Enum(
                    "AccessRule::Protected", 
                    Enum(
                        "AccessRuleNode::ProofRule", 
                        Enum(
                            "ProofRule::Require", 
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible", 
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            ),
            Tuple(
                Enum("TypedModuleId::Metadata"),
                "set"
            ),
            Enum(
                "AccessRuleEntry::AccessRule", 
                Enum(
                    "AccessRule::Protected", 
                    Enum(
                        "AccessRuleNode::ProofRule", 
                        Enum(
                            "ProofRule::Require", 
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible", 
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            ),
            Tuple(
                Enum("TypedModuleId::Metadata"),
                "get"
            ),
            Enum(
                "AccessRuleEntry::AccessRule", 
                Enum("AccessRule::AllowAll")
            )
        ), 
        Map<String, Enum>(),     # Grouped Auth Field
        Enum(
            "AccessRuleEntry::AccessRule",
            Enum("AccessRule::DenyAll")         # Default Auth Field
        ),
        Map<Tuple, Enum>(         # Method Auth Mutability Field
            Tuple(
                Enum("TypedModuleId::ObjectState"),
                "set_royalty_config"
            ),
            Enum(
                "AccessRuleEntry::AccessRule",
                Enum(
                    "AccessRule::Protected",
                    Enum(
                        "AccessRuleNode::ProofRule",
                        Enum(
                            "ProofRule::Require",
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible",
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            ),
            Tuple(
                Enum("TypedModuleId::ObjectState"),
                "claim_royalty"
            ),
            Enum(
                "AccessRuleEntry::AccessRule",
                Enum(
                    "AccessRule::Protected",
                    Enum(
                        "AccessRuleNode::ProofRule",
                        Enum(
                            "ProofRule::Require",
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible",
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            ),
            Tuple(
                Enum("TypedModuleId::Metadata"),
                "set"
            ),
            Enum(
                "AccessRuleEntry::AccessRule",
                Enum(
                    "AccessRule::Protected",
                    Enum(
                        "AccessRuleNode::ProofRule",
                        Enum(
                            "ProofRule::Require",
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible",
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            ),
            Tuple(
                Enum("TypedModuleId::Metadata"),
                "get"
            ),
            Enum(
                "AccessRuleEntry::AccessRule",
                Enum(
                    "AccessRule::Protected",
                    Enum(
                        "AccessRuleNode::ProofRule",
                        Enum(
                            "ProofRule::Require",
                            Enum(
                                "SoftResourceOrNonFungible::StaticNonFungible",
                                NonFungibleGlobalId("${nftAddress}")
                            )
                        )
                    )
                )
            )
        ), 
        Map<String, Enum>(),     # Group Auth Mutability Field
        Enum(
            "AccessRuleEntry::AccessRule",
            Enum("AccessRule::DenyAll")          # Default Auth Mutability Field
        )
    );`
}
