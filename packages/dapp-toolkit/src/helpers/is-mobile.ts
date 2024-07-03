import Bowser from 'bowser'

export const isMobile = (userAgent: string = window.navigator.userAgent) => {
  const parsed = Bowser.parse(userAgent)
  return parsed.platform.type === 'mobile' || parsed.platform.type === 'tablet'
}
