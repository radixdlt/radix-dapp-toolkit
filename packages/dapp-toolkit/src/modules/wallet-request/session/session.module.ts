import type { ResultAsync } from 'neverthrow'
import { okAsync } from 'neverthrow'
import { StorageModule } from '../../storage/local-storage.module'
import { v4 as uuidV4 } from 'uuid'

export type Session = {
  sessionId: string
  createdAt: number
}

export type SessionModule = ReturnType<typeof SessionModule>
export const SessionModule = (input: {
  providers: {
    storageModule: StorageModule<Session>
  }
}) => {
  const storageModule = input.providers.storageModule

  const getSession = (): ResultAsync<
    Session | undefined,
    { reason: string; jsError: Error }
  > =>
    storageModule
      .getItems()
      .mapErr((error) => ({
        reason: 'couldNotReadSessionFromStore',
        jsError: error,
      }))
      .map((sessions) => sessions[0])

  const getSessionById = (sessionId: string) =>
    storageModule
      .getItemById(sessionId)
      .mapErr((error) => ({ reason: 'couldNotGetSessionById', jsError: error }))

  const createSession = (): ResultAsync<
    Session,
    { reason: string; jsError: Error }
  > => {
    const sessionId = uuidV4()
    const newSession: Session = {
      sessionId,
      createdAt: Date.now(),
    }

    return storageModule
      .setItems({ [sessionId]: newSession })
      .map(() => newSession)
      .mapErr((error) => ({ reason: 'couldNotCreateSession', jsError: error }))
  }

  const patchSession = (sessionId: string, value: Partial<Session>) =>
    storageModule
      .patchItem(sessionId, value)
      .mapErr((error) => ({ reason: 'couldNotPatchSession', jsError: error }))

  const getCurrentSession = (): ResultAsync<
    Session,
    { reason: string; jsError: Error }
  > =>
    getSession().andThen((session) =>
      session ? okAsync(session) : createSession(),
    )

  return {
    getCurrentSession,
    getSession,
    store: storageModule,
    getSessionById,
    patchSession,
  }
}
