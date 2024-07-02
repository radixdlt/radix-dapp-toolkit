import { describe, it, expect } from 'vitest'
import { isDeepEqual } from './is-deep-equal'

describe('isDeepEqual', () => {
  const truthyTestCases = [
    [{}, {}],
    [[], []],
    [undefined, undefined],
    [null, null],
    [true, true],
    [false, false],
    ['abc', 'abc'],
    [123, 123],
    [{ a: 1 }, { a: 1 }],
    [
      {
        walletData: {
          accounts: [
            {
              address:
                'account_rdx12y4l35lh2543nff9pyyzvsh64ssu0dv6fq20gg8suslwmjvkylejgj',
              label: 'First',
              appearanceId: 0,
            },
          ],
          personaData: [],
          persona: {
            identityAddress:
              'identity_rdx122dsgw5n3dqng989nrpa90ah96y8xyz9kxfwu7luttj47ggn799qdk',
            label: 'SowaRdx',
          },
          proofs: [],
        },
        sharedData: {
          persona: {
            proof: true,
          },
          ongoingAccounts: {
            numberOfAccounts: {
              quantifier: 'atLeast',
              quantity: 1,
            },
            proof: false,
          },
        },
        loggedInTimestamp: '1703841637620',
      },
      {
        walletData: {
          accounts: [
            {
              label: 'First',
              address:
                'account_rdx12y4l35lh2543nff9pyyzvsh64ssu0dv6fq20gg8suslwmjvkylejgj',

              appearanceId: 0,
            },
          ],
          personaData: [],
          persona: {
            label: 'SowaRdx',
            identityAddress:
              'identity_rdx122dsgw5n3dqng989nrpa90ah96y8xyz9kxfwu7luttj47ggn799qdk',
          },
          proofs: [],
        },
        loggedInTimestamp: '1703841637620',
        sharedData: {
          ongoingAccounts: {
            proof: false,
            numberOfAccounts: {
              quantifier: 'atLeast',
              quantity: 1,
            },
          },
          persona: {
            proof: true,
          },
        },
      },
    ],
  ]

  const falsyTestCases = [
    [{}, { a: 1 }],
    [undefined, {}],
    [null, {}],
    ['abc', 123],
    [1234, 1],
    [123, {}],
    ['123', 123],
    [true, false],
    [{ a: 1 }, { a: 1, b: 2 }],
    [{ a: 1 }, { b: 1 }],
    [{ a: 1 }, { a: 2 }],
    ['a', []],
    [{ a: 1, b: 2 }, { a: 1 }],
  ]
  it('should return true if two objects are deeply equal', () => {
    truthyTestCases.forEach(([a, b]) => {
      const comparison = isDeepEqual(a, b)
      if (comparison === false) {
        console.log('Failed with:', a, b)
      }
      expect(comparison).toBe(true)
    })
  })

  it('should return false if two objects are not deeply equal', () => {
    falsyTestCases.forEach(([a, b]) => {
      const comparison = isDeepEqual(a, b)
      if (comparison === true) {
        console.log('Failed with:', a, b)
      }
      expect(comparison).toBe(false)
    })
  })
})
