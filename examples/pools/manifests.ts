export const createPoolManifest = (
  poolAddress: string,
  poolType: 'OneResourcePool' | 'TwoResourcePool' | 'MultiResourcePool',
  ...resourceAddresses: string[]
) => {
  const resourcesParameters = {
    OneResourcePool: (resourceAddresses: string[]) =>
      `Address("${resourceAddresses[0]}")`,
    TwoResourcePool: (resourceAddresses: string[]) =>
      `Tuple(${resourceAddresses
        .map((address) => `Address("${address}")`)
        .join(', ')})`,
    MultiResourcePool: (resourceAddresses: string[]) =>
      `Array<Address>(${resourceAddresses
        .map((address) => `Address("${address}")`)
        .join(', ')})`,
  }

  const manifest = `CALL_FUNCTION Address("${poolAddress}") 
    "${poolType}"
    "instantiate"
    Enum<OwnerRole::Fixed>(Enum<AccessRule::AllowAll>())
    Enum<AccessRule::AllowAll>() 
    ${resourcesParameters[poolType](resourceAddresses)};`

  console.log(manifest)
  return manifest
}

export const contributeToPoolManifest = (
  account: string,
  poolComponent: string,
  contributions: {
    amount: string
    resourceAddress: string
    accountToWithdrawFrom?: string
  }[]
) => {
  const bucketIds = contributions.map(() => crypto.randomUUID())
  const bucketsCreation = contributions.map((contribution, index) => {
    const accountToWithdrawFrom = contribution.accountToWithdrawFrom || account
    return `
    CALL_METHOD 
      Address("${accountToWithdrawFrom}") 
      "withdraw" 
      Address("${contribution.resourceAddress}") 
      Decimal("${contribution.amount}");
      
    TAKE_ALL_FROM_WORKTOP
      Address("${contribution.resourceAddress}")
      Bucket("${bucketIds[index]}");`
  })
  const poolContributions = `
    CALL_METHOD
    Address("${poolComponent}")
    "contribute"
    ${
      bucketIds.length === 1
        ? `Bucket("${bucketIds[0]}")`
        : bucketIds.length === 2
        ? `Tuple(
        ${bucketIds.map((bucketId) => `Bucket("${bucketId}")`).join(',')} 
    )`
        : `Array<Bucket>(${bucketIds
            .map((bucketId) => `Bucket("${bucketId}")`)
            .join(',')} )`
    }
;
  `

  const manifest = `
    ${bucketsCreation.join('\n')}    
    ${poolContributions}
    CALL_METHOD
      Address("${account}")
      "try_deposit_batch_or_abort"
      Expression("ENTIRE_WORKTOP");
  `
  console.log(manifest)
  return manifest
}
