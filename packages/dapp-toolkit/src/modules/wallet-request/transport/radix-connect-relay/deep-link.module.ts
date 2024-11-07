import { ResultAsync } from 'neverthrow'
import { errAsync, okAsync } from 'neverthrow'
import { Logger, isMobile } from '../../../../helpers'
import Bowser from 'bowser'
import { SdkError } from '../../../../error'
import { isTMA } from './helpers'

export type DeepLinkModule = ReturnType<typeof DeepLinkModule>
export const DeepLinkModule = (input: {
  logger?: Logger
  walletUrl: string
}) => {
  const { walletUrl } = input
  const userAgent = Bowser.parse(window.navigator.userAgent)
  const { platform } = userAgent
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkModule' })
  const isTelegramMiniApp = isTMA(globalThis)

  logger?.debug({
    platform,
    userAgent: window.navigator.userAgent,
    userAgentParsed: userAgent,
  })

  const deepLinkToWallet = (
    values: Record<string, string>,
  ): ResultAsync<undefined, SdkError> => {
    const outboundUrl = new URL(walletUrl)

    Object.entries(values).forEach(([key, value]) => {
      outboundUrl.searchParams.append(key, value)
    })

    logger?.debug({
      method: 'deepLinkToWallet',
      data: { ...values },
    })

    if (isMobile()) {
      const deepLink = outboundUrl.toString()

      // Telegram Mini App does not support deep linking by changing location.href value
      if (isTelegramMiniApp) globalThis.open(deepLink, '_blank')
      else if (globalThis.location?.href) globalThis.location.href = deepLink

      return okAsync(undefined)
    }

    return errAsync(SdkError('UnhandledEnvironment', ''))
  }

  return {
    deepLinkToWallet,
  }
}
