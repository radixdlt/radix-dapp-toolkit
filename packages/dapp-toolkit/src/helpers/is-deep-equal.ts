export const isDeepEqual = (a: any, b: any): boolean => {
  const values = [null, undefined, false, true]
  if (
    values.includes(a) ||
    values.includes(b) ||
    typeof a === 'number' ||
    typeof b === 'number'
  ) {
    return Object.is(a, b)
  }

  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    const value1 = a[key]
    const value2 = b[key]

    const isObjects = isObject(value1) && isObject(value2)

    if (
      (isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false
    }
  }
  return true
}

const isObject = (x: unknown): boolean => {
  return x != null && typeof x === 'object'
}
