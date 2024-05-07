export const generateRolaChallenge = () =>
  [...globalThis.crypto.getRandomValues(new Uint8Array(32))]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')
