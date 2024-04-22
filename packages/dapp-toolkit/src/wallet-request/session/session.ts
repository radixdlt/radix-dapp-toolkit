import type { ResultAsync } from 'neverthrow'
import { errAsync, okAsync } from 'neverthrow'
import type { IdentityClient } from '../identity/identity'
import { StorageProvider } from '../../storage/local-storage-client'

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

export type SessionClient = ReturnType<typeof SessionClient>
export const SessionClient = (input: {
  providers: {
    storageClient: StorageProvider<Session>
    identityClient: IdentityClient
  }
}) => {
  const storageClient = input.providers.storageClient
  const identityClient = input.providers.identityClient

  const findActiveSession = (): ResultAsync<
    ActiveSession | undefined,
    { reason: string }
  > =>
    storageClient
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
    storageClient.getItemById(sessionId)

  const createSession = (): ResultAsync<PendingSession, Error> => {
    const sessionId = crypto.randomUUID()
    const newSession: PendingSession = {
      sessionId,
      status: Status.Pending,
      createdAt: Date.now(),
      sentToWallet: false,
    }

    return storageClient
      .setItems({ [sessionId]: newSession })
      .map(() => newSession)
  }

  const patchSession = (sessionId: string, value: Partial<Session>) =>
    storageClient.patchItem(sessionId, value)

  const convertToActiveSession = (
    sessionId: string,
    walletIdentity: string,
  ): ResultAsync<ActiveSession, { reason: string }> =>
    storageClient
      .getItemById(sessionId)
      .mapErr(() => ({ reason: 'readFromStorageError' }))
      .andThen((session) =>
        session && session.status === Status.Pending
          ? identityClient
              .deriveSharedSecret('dApp', walletIdentity)
              .andThen((sharedSecret) =>
                storageClient
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
    store: storageClient,
    getSessionById,
    patchSession,
  }
}
