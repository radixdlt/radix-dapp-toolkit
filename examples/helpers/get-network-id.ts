export const getNetworkId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(urlParams.get('networkId') || '13', 10)
  return networkId
}
