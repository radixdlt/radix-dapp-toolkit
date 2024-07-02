export const shortenAddress = (address?: string) =>
  address
    ? `${address.slice(0, 4)}...${address.slice(
        address.length - 6,
        address.length,
      )}`
    : ''
