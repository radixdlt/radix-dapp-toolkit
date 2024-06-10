import { Result, ResultAsync } from 'neverthrow'
import { errAsync, ok, okAsync } from 'neverthrow'
import { Logger } from '../../../../helpers'
import { ReplaySubject } from 'rxjs'
import { SdkError } from '../../../../error'
import Bowser from 'bowser'

const uaParsing = (logger?: Logger) => {
  const userAgent = Bowser.parse(globalThis.navigator.userAgent)
  const { platform, browser } = userAgent

  const getNavigator = (): Navigator | undefined => globalThis?.navigator

  const navigator = getNavigator() as any

  const isBrave = () => {
    // Only exists in Brave browser
    const getBrave = (): { isBrave: () => Promise<boolean> } | undefined =>
      navigator?.brave

    const maybeBrave = getBrave()
    return maybeBrave
      ? ResultAsync.fromPromise(maybeBrave.isBrave(), (error) => error as Error)
      : okAsync(false)
  }

  const isDuckDuckGo = () => {
    try {
      const value = Object.keys(navigator ?? {})[0]

      return value && typeof value === 'string'
        ? okAsync(value.includes('duckduckgo'))
        : okAsync(false)
    } catch (error) {
      return errAsync(error)
    }
  }

  ResultAsync.combine([isBrave(), isDuckDuckGo()]).map(
    ([isBrave, isDuckDuckGo]) => {
      if (isBrave) {
        browser.name = 'Brave'
      } else if (isDuckDuckGo) {
        browser.name = 'DuckDuckGo'
      }

      logger?.debug({ platform, browser })
    },
  )

  return { platform, browser }
}

export type DeepLinkModule = ReturnType<typeof DeepLinkModule>
export const DeepLinkModule = (input: {
  logger?: Logger
  callBackPath: string
  walletUrl: string
}) => {
  const { callBackPath, walletUrl } = input
  const { platform, browser } = uaParsing(input.logger)
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkModule' })

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
