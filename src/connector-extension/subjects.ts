import { Subject } from 'rxjs'
import {
  MessageLifeCycleEvent,
  MessageLifeCycleExtensionStatusEvent,
  WalletInteraction,
  WalletInteractionResponse,
} from '@radixdlt/wallet-sdk'
import { ExtensionInteraction } from './schemas'

export type Subjects = ReturnType<typeof Subjects>

export const Subjects = () => ({
  outgoingMessageSubject: new Subject<
    WalletInteraction | ExtensionInteraction
  >(),
  incomingMessageSubject: new Subject<
    | MessageLifeCycleEvent
    | MessageLifeCycleExtensionStatusEvent
    | WalletInteractionResponse
  >(),
  responseSubject: new Subject<WalletInteractionResponse>(),
  messageLifeCycleEventSubject: new Subject<MessageLifeCycleEvent>(),
})
