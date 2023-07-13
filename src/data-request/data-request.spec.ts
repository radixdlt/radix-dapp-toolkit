import { accounts } from './builders/accounts'
import { DataRequestClient } from './data-request'
import { persona } from './builders/persona'
import { personaData } from './builders/persona-data'

describe('dataRequest', () => {
  let dataRequest: DataRequestClient

  beforeEach(() => {
    dataRequest = DataRequestClient({} as any)
  })

  it('should be instantiated with default values', () => {
    expect(dataRequest.getState()).toEqual({
      accounts: {
        numberOfAccounts: { quantifier: 'atLeast', quantity: 1 },
        withProof: false,
        reset: false,
      },
      persona: { withProof: false },
      personaData: {},
    })
  })

  describe('Accounts', () => {
    it('should set default account values', () => {
      dataRequest.setState(accounts())
      expect(dataRequest.getState()).toEqual({
        accounts: {
          numberOfAccounts: { quantifier: 'atLeast', quantity: 1 },
          withProof: false,
          reset: false,
        },
      })
    })

    it('should set exactly 2 with proof and reset', () => {
      dataRequest.setState(accounts().exactly(2).withProof().reset())
      expect(dataRequest.getState()).toEqual({
        accounts: {
          numberOfAccounts: { quantifier: 'exactly', quantity: 2 },
          withProof: true,
          reset: true,
        },
      })
    })

    it('should set exactly 2 with proof and reset', () => {
      dataRequest.setState(accounts().exactly(2).withProof().reset())
      expect(dataRequest.getState()).toEqual({
        accounts: {
          numberOfAccounts: { quantifier: 'exactly', quantity: 2 },
          withProof: true,
          reset: true,
        },
      })
    })
  })

  describe('PersonaData', () => {
    it('should set persona data full name', () => {
      dataRequest.setState(personaData().fullName())

      expect(dataRequest.getState()).toEqual({
        fullName: true,
      })
    })

    it('should set persona data values', () => {
      dataRequest.setState(
        personaData()
          .fullName()
          .emailAddresses.atLeast(2)
          .phoneNumbers.exactly(1)
          .reset()
      )
      expect(dataRequest.getState().personaData).toEqual({
        fullName: true,
        emailAddresses: { quantifier: 'atLeast', quantity: 2 },
        phoneNumbers: { quantifier: 'exactly', quantity: 1 },
        reset: true,
      })
    })
  })

  describe('Persona', () => {
    it('should set persona withProof', () => {
      dataRequest.setState(persona().withProof())

      expect(dataRequest.getState().persona).toEqual({
        withProof: true,
      })
    })
  })
})
