import { Subject } from 'rxjs'
import type {
  ExtensionInteraction,
  MessageLifeCycleEvent,
  MessageLifeCycleExtensionStatusEvent,
  WalletInteraction,
  WalletInteractionResponse,
} from '../../../../schemas'

export type ConnectorExtensionSubjects = ReturnType<
  typeof ConnectorExtensionSubjects
>

export const ConnectorExtensionSubjects = () => ({
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
