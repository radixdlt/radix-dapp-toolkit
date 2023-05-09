import { DataRequestValue, State } from '../../_types'
import { ok, Result } from 'neverthrow'

export const withAuth = (
  request: DataRequestValue,
  persona: State['persona']
): Result<DataRequestValue, never> => {
  const shouldAuthenticateRequest =
    Object.keys(request).length === 0 ||
    request.ongoingAccountsWithoutProofOfOwnership ||
    request.ongoingAccountsWithProofOfOwnership ||
    request.ongoingPersonaData

  if (shouldAuthenticateRequest) {
    if (persona && !request.loginWithChallenge)
      return ok({
        ...request,
        usePersona: {
          identityAddress: persona.identityAddress,
        },
      })
    else if (!request.loginWithChallenge) {
      return ok({
        ...request,
        loginWithoutChallenge: { discriminator: 'loginWithoutChallenge' },
      })
    } else return ok(request)
  }

  return ok(request)
}
