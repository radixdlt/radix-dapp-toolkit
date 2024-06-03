import { Result, ResultAsync } from 'neverthrow'
import { errAsync, ok, okAsync } from 'neverthrow'
import { Logger } from '../../../../helpers'
import { ReplaySubject } from 'rxjs'
import Bowser from 'bowser'
import { SdkError } from '../../../../error'

export type DeepLinkModule = ReturnType<typeof DeepLinkModule>
export const DeepLinkModule = (input: {
  logger?: Logger
  callBackPath: string
  walletUrl: string
}) => {
  const { callBackPath, walletUrl } = input
  const userAgent = Bowser.parse(window.navigator.userAgent)
  const { platform, browser } = userAgent
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkModule' })

  const getNavigator = (): Navigator | undefined => globalThis?.navigator

  // Only exists in Brave browser
  const getBrave = (): { isBrave: () => Promise<boolean> } | undefined =>
    (getNavigator() as any)?.brave

  const isBrave = () => {
    const maybeBrave = getBrave()
    return maybeBrave
      ? ResultAsync.fromPromise(maybeBrave.isBrave(), (error) => error as Error)
      : okAsync(false)
  }

  isBrave().map((isBrave) => {
    if (isBrave) {
      browser.name = 'Brave'
    }

    logger?.debug({ platform, browser })
  })

  const walletResponseSubject = new ReplaySubject<Record<string, string>>(1)

  const isCallbackUrl = () => window.location.href.includes(callBackPath)

  const shouldHandleWalletCallback = () =>
    platform.type === 'mobile' && isCallbackUrl()

  const deepLinkToWallet = (
    values: Record<string, string>,
  ): ResultAsync<undefined, SdkError> => {
    const outboundUrl = new URL(walletUrl)

    Object.entries(values).forEach(([key, value]) => {
      outboundUrl.searchParams.append(key, value)
    })

    outboundUrl.searchParams.append('browser', browser.name ?? 'unknown')

    logger?.debug({
      method: 'deepLinkToWallet',
      queryParams: outboundUrl.searchParams.toString(),
      browser: browser.name ?? 'unknown',
    })

    if (platform.type === 'mobile') {
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
