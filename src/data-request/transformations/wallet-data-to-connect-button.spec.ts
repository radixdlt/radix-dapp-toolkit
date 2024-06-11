
import { transformWalletDataToConnectButton } from './wallet-data-to-connect-button'
describe('transformWalletDataToConnectButton', () => {
  describe('when persona data contain empty arrays', () => {
    it('should not fail', () => {
      // Arrange
      const walletData = {
        personaData: [
          {
            entry: 'emailAddresses',
            fields: [],
          },
          {
            entry: 'phoneNumbers',
            fields: [],
          },
        ],
      } as any

      // Act
      const result = transformWalletDataToConnectButton(walletData)

      // Assert
      expect(result).toEqual({
        accounts: [],
        personaLabel: '',
        connected: false,
        personaData: [],
      })
    })
  })
})
