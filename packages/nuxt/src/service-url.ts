function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0)!
    return code <= 0x1F || code === 0x7F
  })
}

export function parseSafeHttpServiceUrl(value: string, description: string): URL {
  const error = (): TypeError => new TypeError(
    `${description} must be an exact absolute HTTP(S) URL without embedded credentials.`,
  )
  if (value.length === 0
    || value !== value.trim()
    || value.includes('\\')
    || hasControlCharacter(value)) {
    throw error()
  }
  let url: URL
  try {
    url = new URL(value)
  }
  catch {
    throw error()
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:')
    || url.username.length > 0
    || url.password.length > 0) {
    throw error()
  }
  return url
}
