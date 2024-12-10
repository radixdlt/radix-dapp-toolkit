import { ResultAsync } from 'neverthrow'
import { errAsync, okAsync } from 'neverthrow'
import { Logger } from '../../../../helpers'
import { SdkError } from '../../../../error'
import { isTMA } from './helpers'
import { EnvironmentModule } from '../../../environment'

export type DeepLinkModule = ReturnType<typeof DeepLinkModule>
export const DeepLinkModule = (input: {
  logger?: Logger
  walletUrl: string,
  providers: {
    environmentModule: EnvironmentModule
  }
}) => {
  const { walletUrl } = input
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkModule' })
  const isTelegramMiniApp = isTMA(globalThis)

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

    if (input.providers.environmentModule.isMobile()) {
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
