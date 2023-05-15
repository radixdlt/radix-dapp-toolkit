import {
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
  map,
  shareReplay,
  tap,
} from 'rxjs'
import { createObservableHook } from '../helpers/create-observable-hook'
import { PersonaDataField } from '@radixdlt/wallet-sdk'
import { ResultAsync } from 'neverthrow'
import {
  decodeStateFromUrlHash,
  encodeStateToUrlHash,
} from '../helpers/url-state'

const state = decodeStateFromUrlHash()

type LoginState = {
  challenge?: string
}

const loginStateDefaults: LoginState = state?.login ?? ({} satisfies LoginState)

export const loginState = new BehaviorSubject<LoginState>(loginStateDefaults)

export const useLoginState = createObservableHook<LoginState>(
  loginState,
  loginStateDefaults
)

type AccountsState = {
  enabled: boolean
  quantity: number
  quantifier: string
  reset: boolean
  oneTime: boolean
  challenge?: string
}

const accountStateDefaults =
  state?.accounts ??
  ({
    enabled: true,
    quantifier: 'atLeast',
    quantity: 1,
    reset: false,
    oneTime: false,
    challenge: undefined,
  } satisfies AccountsState)

export const accountsState = new BehaviorSubject<AccountsState>(
  accountStateDefaults
)

export const useAccountsState = createObservableHook<AccountsState>(
  accountsState,
  accountStateDefaults
)

type PersonaDataState = {
  enabled: boolean
  reset: boolean
  oneTime: boolean
  fields: PersonaDataField[]
}

const personaDataStateDefaults =
  state?.personaData ??
  ({
    enabled: false,
    reset: false,
    oneTime: false,
    fields: ['givenName', 'emailAddress', 'familyName', 'phoneNumber'],
  } satisfies PersonaDataState)

export const personaDataState = new BehaviorSubject<PersonaDataState>(
  personaDataStateDefaults
)

export const usePersonaDataState = createObservableHook<PersonaDataState>(
  personaDataState,
  personaDataStateDefaults
)

export const dataRequestPayload$ = combineLatest([
  loginState.pipe(
    tap((values) => encodeStateToUrlHash('login', values)),
    map((values) => (values.challenge ? values : {}))
  ),
  accountsState.pipe(
    tap((values) => encodeStateToUrlHash('accounts', values)),
    map(({ enabled, ...rest }) => (enabled ? rest : undefined))
  ),
  personaDataState.pipe(
    tap((values) => encodeStateToUrlHash('personaData', values)),
    map(({ enabled, ...rest }) => (enabled ? rest : undefined))
  ),
]).pipe(
  map(([login, accounts, personaData]) => {
    const data: any = {}
    if (login) data.challenge = login.challenge
    if (accounts) data.accounts = accounts
    if (personaData) data.personaData = personaData
    return data
  }),
  shareReplay(1)
)

export const useDataRequestPayload = createObservableHook<any>(
  dataRequestPayload$,
  {}
)

export const getRequestDataPayload = () =>
  ResultAsync.fromSafePromise(firstValueFrom(dataRequestPayload$))
