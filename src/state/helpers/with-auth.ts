import { DataRequestValue, State } from '../../_types'

export const withAuth = (request: DataRequestValue, state: State) => {
  if (state.persona)
    return {
      ...request,
      usePersona: {
        discriminator: 'usePersona',
        identityAddress: state.persona.identityAddress,
      },
    }
  return { ...request, loginWithoutChallenge: { discriminator: 'login' } }
}
