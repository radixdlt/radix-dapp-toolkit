import { ResultAsync } from 'neverthrow'
import { errAsync, okAsync } from 'neverthrow'
import { Logger } from '../../../../helpers'
import Bowser from 'bowser'
import { SdkError } from '../../../../error'

export type DeepLinkModule = ReturnType<typeof DeepLinkModule>
export const DeepLinkModule = (input: {
  logger?: Logger
  walletUrl: string
}) => {
  const { walletUrl } = input
  const userAgent = Bowser.parse(window.navigator.userAgent)
  const { platform } = userAgent
  const logger = input?.logger?.getSubLogger({ name: 'DeepLinkModule' })

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

    if (platform.type === 'mobile' && globalThis.location?.href) {
      globalThis.location.href = outboundUrl.toString()

      return okAsync(undefined)
    }

    return errAsync(SdkError('UnhandledEnvironment', ''))
  }

  return {
    deepLinkToWallet,
  }
}
