import { DataRequestValue, State } from '../../_types'
import { ok, Result } from 'neverthrow'

export const withAuth = (
  request: DataRequestValue,
  persona: State['persona']
): Result<DataRequestValue, never> => {
  const shouldAuthenticateRequest =
    Object.keys(request).length === 0 ||
    request.ongoingAccountsWithoutProofOfOwnership ||
    request.ongoingPersonaData

  if (shouldAuthenticateRequest) {
    if (persona)
      return ok({
        ...request,
        usePersona: {
          identityAddress: persona.identityAddress,
        },
      })
    else
      return ok({
        ...request,
        loginWithoutChallenge: { discriminator: 'login' },
      })
  }

  return ok(request)
}
