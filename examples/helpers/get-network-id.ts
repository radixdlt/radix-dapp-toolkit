export const getNetworkId = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const networkId = parseInt(urlParams.get('networkId') || '12', 10)
  return networkId
}
