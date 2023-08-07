import { WalletData } from '../../state/types'

export const transformWalletDataToConnectButton = (walletData: WalletData) => {
  const accounts = walletData.accounts ?? []
  const personaLabel = walletData?.persona?.label ?? ''
  const connected = !!walletData?.persona
  const personaData = walletData.personaData
    .map((item) => {
      if (item.entry === 'fullName') {
        const { variant, givenNames, familyName, nickname } = item.fields
        return {
          value:
            variant === 'western'
              ? `${givenNames}${
                  nickname ? ` "${nickname}" ` : ' '
                }${familyName}`
              : `${familyName}${
                  nickname ? ` "${nickname}" ` : ' '
                }${givenNames}`,
          field: 'fullName',
        }
      } else if (item.entry === 'emailAddresses') {
        return {
          // currently only one email address is supported
          value: item.fields[0],
          field: 'emailAddress',
        }
      } else if (item.entry === 'phoneNumbers') {
        return {
          // currently only one phone number is supported
          value: item.fields[0],
          field: 'phoneNumber',
        }
      }
      return
    })
    .filter(
      (
        item
      ): item is {
        value: string
        field: string
      } => !!item
    )

  return { accounts, personaLabel, connected, personaData }
}
