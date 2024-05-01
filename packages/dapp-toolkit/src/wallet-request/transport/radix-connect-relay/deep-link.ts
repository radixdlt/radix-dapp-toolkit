import type { Result, ResultAsync } from 'neverthrow'
import { errAsync, ok, okAsync } from 'neverthrow'
import { Logger } from '../../../helpers'
import { BehaviorSubject, ReplaySubject } from 'rxjs'
import Bowser from 'bowser'
import { SdkError } from '../../../error'

export type DeepLinkClient = ReturnType<typeof DeepLinkClient>
export const DeepLinkClient = (input: {
  logger?: Logger
  callBackPath: string
  walletUrl: string
}) => {
  const { callBackPath, walletUrl } = input
  const userAgent = Bowser.parse(window.navigator.userAgent)
  const { platform, os, browser } = userAgent
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkClient' })

  const walletResponseSubject = new ReplaySubject<Record<string, string>>(1)

  const isCallbackUrl = () => window.location.href.includes(callBackPath)

  const shouldHandleWalletCallback = () =>
    platform.type === 'mobile' && isCallbackUrl()

  const deepLinkToWallet = (
    values: Record<string, string>,
  ): ResultAsync<undefined, SdkError> => {
    const outboundUrl = new URL(walletUrl)
    const currentUrl = new URL(window.origin)
    currentUrl.hash = callBackPath

    Object.entries(values).forEach(([key, value]) => {
      outboundUrl.searchParams.append(key, value)
    })

    outboundUrl.searchParams.append('browser', browser.name ?? 'unknown')

    logger?.debug({
      method: 'deepLinkToWallet',
      queryParams: outboundUrl.searchParams.toString(),
      browser: browser.name ?? 'unknown',
    })

    if (os.name === 'iOS') {
      window.location.href = outboundUrl.toString()

      return okAsync(undefined)
    }

    return errAsync(SdkError('UnhandledOs', ''))
  }

  const getWalletResponseFromUrl = (): Result<
    Record<string, string>,
    { reason: string }
  > => {
    const url = new URL(window.location.href)
    const values = Object.fromEntries([...url.searchParams.entries()])
    logger?.debug({
      method: 'getWalletResponseFromUrl',
      values,
    })
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
