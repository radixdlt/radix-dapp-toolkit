import type { Result, ResultAsync } from 'neverthrow'
import { errAsync, ok, okAsync } from 'neverthrow'
import { Logger } from '../../../helpers'
import { BehaviorSubject } from 'rxjs'

export type DeepLinkClient = ReturnType<typeof DeepLinkClient>
export const DeepLinkClient = (input: {
  logger?: Logger
  callBackPath: string
  walletUrl: string
  origin: string
  userAgent: Bowser.Parser.ParsedResult
}) => {
  const { callBackPath, walletUrl, origin, userAgent } = input
  const { platform, os, browser } = userAgent
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkClient' })

  const walletResponseSubject = new BehaviorSubject<Record<string, string>>({})

  const isCallbackUrl = () => window.location.href.includes(callBackPath)

  const shouldHandleWalletCallback = () =>
    platform.type === 'mobile' && isCallbackUrl()

  const deepLinkToWallet = (
    values: Record<string, string>,
    childWindow?: Window,
  ): ResultAsync<undefined, never> => {
    const outboundUrl = new URL(walletUrl)
    const childWindowUrl = new URL(origin)
    const currentUrl = new URL(window.origin)
    currentUrl.hash = callBackPath

    if (childWindow) childWindowUrl.hash = callBackPath

    Object.entries(values).forEach(([key, value]) => {
      outboundUrl.searchParams.append(key, value)
      if (childWindow) childWindowUrl.searchParams.append(key, value)
    })

    logger?.debug({
      method: 'deepLinkToWallet',
      childWindowUrl: childWindowUrl.toString(),
      outboundUrl: outboundUrl.toString(),
    })

    if (childWindow && os.name === 'iOS' && browser.name === 'Safari') {
      childWindow.location.href = outboundUrl.toString()
      return okAsync(undefined)
    } else if (os.name === 'iOS' && browser.name === 'Safari') {
      window.location.href = outboundUrl.toString()
      return okAsync(undefined)
    }

    return okAsync(undefined)
  }

  const getWalletResponseFromUrl = (): Result<
    Record<string, string>,
    { reason: string }
  > => {
    const url = new URL(window.location.href)
    const values = Object.fromEntries([...url.searchParams.entries()])
    return ok(values)
  }

  const handleWalletCallback = () => {
    if (shouldHandleWalletCallback())
      return getWalletResponseFromUrl()
        .map((values) => {
          walletResponseSubject.next(values)

          return errAsync({ reason: 'InvalidCallbackValues' })
        })
        .mapErr((error) => {
          logger?.debug({
            method: 'handleWalletCallback.error',
            reason: error.reason,
          })
          return error
        })
  }

  return {
    deepLinkToWallet,
    handleWalletCallback,
    walletResponse$: walletResponseSubject.asObservable(),
  }
}
