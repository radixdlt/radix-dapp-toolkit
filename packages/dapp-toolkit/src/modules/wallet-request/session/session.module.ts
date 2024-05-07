import type { ResultAsync } from 'neverthrow'
import { errAsync, okAsync } from 'neverthrow'
import type { IdentityModule } from '../identity/identity.module'
import { StorageModule } from '../../storage/local-storage.module'

type Status = (typeof Status)[keyof typeof Status]
const Status = { Pending: 'Pending', Active: 'Active' } as const

export type PendingSession = {
  status: typeof Status.Pending
  createdAt: number
  sessionId: string
  sentToWallet: boolean
}

export type ActiveSession = {
  status: typeof Status.Active
  walletIdentity: string
  createdAt: number
  sharedSecret: string
  sessionId: string
}

export type Session = PendingSession | ActiveSession

export type SessionModule = ReturnType<typeof SessionModule>
export const SessionModule = (input: {
  providers: {
    storageModule: StorageModule<Session>
    identityModule: IdentityModule
  }
}) => {
  const storageModule = input.providers.storageModule
  const identityModule = input.providers.identityModule

  const findActiveSession = (): ResultAsync<
    ActiveSession | undefined,
    { reason: string }
  > =>
    storageModule
      .getItems()
      .mapErr(() => ({ reason: 'couldNotReadFromStore' }))
      .map((sessions) => {
        const activeSession = Object.values(sessions).find(
          (session): session is ActiveSession =>
            session.status === Status.Active,
        )
        return activeSession
      })

  const getSessionById = (sessionId: string) =>
    storageModule.getItemById(sessionId)

  const createSession = (): ResultAsync<PendingSession, Error> => {
    const sessionId = crypto.randomUUID()
    const newSession: PendingSession = {
      sessionId,
      status: Status.Pending,
      createdAt: Date.now(),
      sentToWallet: false,
    }

    return storageModule
      .setItems({ [sessionId]: newSession })
      .map(() => newSession)
  }

  const patchSession = (sessionId: string, value: Partial<Session>) =>
    storageModule.patchItem(sessionId, value)

  const convertToActiveSession = (
    sessionId: string,
    walletIdentity: string,
  ): ResultAsync<ActiveSession, { reason: string }> =>
    storageModule
      .getItemById(sessionId)
      .mapErr(() => ({ reason: 'readFromStorageError' }))
      .andThen((session) =>
        session && session.status === Status.Pending
          ? identityModule
              .deriveSharedSecret('dApp', walletIdentity)
              .andThen((sharedSecret) =>
                storageModule
                  .setItems({
                    [sessionId]: {
                      ...session,
                      status: Status.Active,
                      walletIdentity,
                      sharedSecret,
                    },
                  })
                  .map(() => ({
                    ...session,
                    status: Status.Active,
                    walletIdentity,
                    sharedSecret,
                  }))
                  .mapErr(() => ({ reason: 'writeToStorageError' })),
              )
          : errAsync({ reason: 'sessionNotPending' }),
      )

  const getCurrentSession = (): ResultAsync<Session, { reason: string }> =>
    findActiveSession().andThen((activeSession) =>
      activeSession
        ? okAsync(activeSession)
        : createSession().mapErr(() => ({ reason: 'couldNotCreateSession' })),
    )

  return {
    getCurrentSession,
    convertToActiveSession,
    findActiveSession,
    store: storageModule,
    getSessionById,
    patchSession,
  }
}
