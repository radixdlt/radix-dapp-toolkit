export const validateRolaChallenge = (challenge?: unknown) =>
    typeof challenge === 'string' && /^[0-9a-f]{64}$/i.test(challenge);