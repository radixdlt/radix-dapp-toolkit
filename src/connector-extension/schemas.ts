import { WalletInteraction, Metadata } from '@radixdlt/wallet-sdk'
import { boolean, literal, object, string, union, z } from 'zod'

export const MessageLifeCycleExtensionStatusEvent = object({
  eventType: literal('extensionStatus'),
  interactionId: string(),
  isWalletLinked: boolean(),
  isExtensionAvailable: boolean(),
  canHandleSessions: boolean().optional(),
})

export type MessageLifeCycleExtensionStatusEvent = z.infer<
  typeof MessageLifeCycleExtensionStatusEvent
>

export const StatusExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal('extensionStatus'),
})

export type StatusExtensionInteraction = z.infer<
  typeof StatusExtensionInteraction
>

export const OpenPopupExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal('openPopup'),
})

export type OpenPopupExtensionInteraction = z.infer<
  typeof OpenPopupExtensionInteraction
>

export type WalletInteractionExtensionInteraction = z.infer<
  typeof WalletInteractionExtensionInteraction
>

export const WalletInteractionExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal('walletInteraction'),
  interaction: WalletInteraction,
  sessionId: string().optional(),
})

export type CancelInteractionExtensionInteraction = z.infer<
  typeof CancelInteractionExtensionInteraction
>

export const CancelInteractionExtensionInteraction = object({
  interactionId: string(),
  discriminator: literal('cancelInteraction'),
  metadata: Metadata,
})

export const ExtensionInteraction = union([
  StatusExtensionInteraction,
  OpenPopupExtensionInteraction,
  WalletInteractionExtensionInteraction,
  CancelInteractionExtensionInteraction,
])

export type ExtensionInteraction = z.infer<typeof ExtensionInteraction>
