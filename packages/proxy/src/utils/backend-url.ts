const HTTP_SCHEME = /^https?:/iu

export function looksLikeHttpBackendUrl(value: string): boolean {
  return HTTP_SCHEME.test(value.trim())
}

export function isSafeHttpBackendUrl(value: string): boolean {
  if (value.length === 0
    || value !== value.trim()
    || value.includes('\\')) {
    return false
  }
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && url.username.length === 0
      && url.password.length === 0
  }
  catch {
    return false
  }
}
