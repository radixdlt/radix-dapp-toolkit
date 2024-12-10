export type EnvironmentModule = ReturnType<typeof EnvironmentModule>
export const EnvironmentModule = () => {
  const isMobile = (userAgent: string) => {
    const ua = userAgent.toLowerCase()

    return /(mobi|ipod|phone|blackberry|opera mini|fennec|minimo|symbian|psp|nintendo ds|archos|skyfire|puffin|blazer|bolt|gobrowser|iris|maemo|semc|teashark|uzard|ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(
      ua,
    )
  }

  const getNavigator = () => {
    return typeof navigator !== 'undefined' ? navigator : undefined
  }

  /**
   * Checks if the provided object is a Telegram Mobile App (TMA) global object.
   *
   * @param maybeTgGlobalObject - The object to check.
   * @returns `true` if the object has WebView initialization parameters, otherwise `false`.
   */
  const isTMA = () =>
    Object.keys((globalThis as any)?.Telegram?.WebView?.initParams || {})
      .length > 0

  return {
    get globalThis() {
      return globalThis
    },
    isMobile: (userAgent?: string) => {
      return isMobile(userAgent ?? getNavigator()?.userAgent ?? '')
    },
    isTMA,
    isBrowser: () => ![typeof window, typeof document].includes('undefined'),
  }
}
