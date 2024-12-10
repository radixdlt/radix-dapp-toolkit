import { ResultAsync } from 'neverthrow'
import { errAsync, okAsync } from 'neverthrow'
import { Logger } from '../../../../helpers'
import { SdkError } from '../../../../error'
import { EnvironmentModule } from '../../../environment'

export type DeepLinkModule = ReturnType<typeof DeepLinkModule>
export const DeepLinkModule = (input: {
  logger?: Logger
  walletUrl: string
  providers: {
    environmentModule: EnvironmentModule
  }
}) => {
  const { walletUrl } = input
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkModule' })
  const isTelegramMiniApp = input.providers.environmentModule.isTMA()

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
      if (isTelegramMiniApp)
        input.providers.environmentModule.globalThis.open(deepLink, '_blank')
      else if (input.providers.environmentModule.globalThis.location?.href)
        input.providers.environmentModule.globalThis.location.href = deepLink

      return okAsync(undefined)
    }

    return errAsync(SdkError('UnhandledEnvironment', ''))
  }

  return {
    deepLinkToWallet,
  }
}
