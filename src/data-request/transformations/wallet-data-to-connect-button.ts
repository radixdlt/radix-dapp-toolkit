import { WalletData } from '../../state/types'

export const transformWalletDataToConnectButton = (walletData: WalletData) => {
  const accounts = walletData.accounts ?? []
  const personaLabel = walletData?.persona?.label ?? ''
  const connected = !!walletData?.persona
  const personaData: { value: string; field: string }[] = []

  if (walletData.personaData) {
    if (walletData.personaData.name) {
      const { variant, givenNames, nickname, familyName } =
        walletData.personaData.name

      personaData.push({ field: 'nickname', value: nickname })
      personaData.push({
        value:
          variant === 'western'
            ? `${givenNames} ${familyName}`
            : `${familyName} ${givenNames}`,
        field: 'fullName',
      })
    }

    if (walletData.personaData.emailAddresses) {
      walletData.personaData.emailAddresses.forEach((emailAddress) => {
        personaData.push({ field: 'emailAddress', value: emailAddress })
      })
    }

    if (walletData.personaData.phoneNumbers) {
      walletData.personaData.phoneNumbers.forEach((phoneNumber) => {
        personaData.push({ field: 'phoneNumber', value: phoneNumber })
      })
    }
  }

  return { accounts, personaLabel, connected, personaData }
}
