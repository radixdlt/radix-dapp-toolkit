import { isBrowser } from '../../../../helpers/is-browser'
import { Logger } from '../../../../helpers'

export const RcfmPageState = {
  loading: 'loading',
  dAppVerified: 'dAppVerified',
  timedOut: 'timedOut',
} as const

export type RcfmPageState = (typeof RcfmPageState)[keyof typeof RcfmPageState]

export type RcfmPageModule = ReturnType<typeof RcfmPageModule>
export const RcfmPageModule = (input: { logger?: Logger }) => {
  const logger = input.logger?.getSubLogger({ name: 'RcfmPageModule' })
  if (!isBrowser()) {
    logger?.debug({ method: 'isBrowser', isBrowser: false })
    return {
      show: () => {},
      hide: () => {},
      showWithData: () => {},
    }
  }

  const rcfmPageHtmlElement = document.createElement('radix-rcfm-page')
  document.body.appendChild(rcfmPageHtmlElement)

  const showWithData = (values: {
    header?: string
    subheader?: string
    isError?: boolean
    isLoading?: boolean
  }) => {
    const { header, subheader, isError, isLoading } = values
    rcfmPageHtmlElement.header = header || ''
    rcfmPageHtmlElement.subheader = subheader || ''
    rcfmPageHtmlElement.isError = isError || false
    rcfmPageHtmlElement.isLoading = isLoading || false
    rcfmPageHtmlElement.isHidden = false
    logger?.debug({
      method: 'showWithData',
      values,
    })
  }
  const hide = () => {
    logger?.debug({ method: 'hide', isHidden: true })
    rcfmPageHtmlElement.isHidden = true
  }

  const show = (state: RcfmPageState) => {
    logger?.debug({ method: 'show', state })
    switch (state) {
      case RcfmPageState.dAppVerified:
        showWithData({
          header: 'Connection succesful!',
          subheader: 'You can now close this tab',
          isError: false,
          isLoading: false,
        })
        break
      case RcfmPageState.loading:
        showWithData({
          isLoading: true,
        })
        break
      case RcfmPageState.timedOut:
        showWithData({
          header: 'Connection timed out',
          subheader: 'Close this tab and try connecting again',
          isError: true,
          isLoading: false,
        })
        break
      default:
        break
    }
  }

  return {
    show,
    hide,
    showWithData,
  }
}
