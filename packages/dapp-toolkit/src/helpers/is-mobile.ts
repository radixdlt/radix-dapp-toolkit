import Bowser from 'bowser'

export const isMobile = () => {
  const userAgent = Bowser.parse(window.navigator.userAgent)
  return userAgent.platform.type === 'mobile'
}
