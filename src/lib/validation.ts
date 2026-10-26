export const MAX_IDENTIFIER_LENGTH = 128

export function validIdentifier(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !value.length ||
    value.length > MAX_IDENTIFIER_LENGTH ||
    /\s/u.test(value)
  )
    return false
  // Explicit pair checks survive minification; an unused encoding call may be removed.
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code < 32 || code === 127) return false
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false
      index++
    } else if (code >= 0xdc00 && code <= 0xdfff) return false
  }
  return true
}

export function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 32) return false
  try {
    return new Date(value).toISOString() === value
  } catch {
    return false
  }
}
