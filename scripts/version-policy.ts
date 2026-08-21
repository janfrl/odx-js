const semanticVersionPattern = /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/u

export function assertSemanticVersion(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !semanticVersionPattern.test(value)) {
    throw new TypeError(
      `Invalid semantic version: ${JSON.stringify(value)}. Expected a version such as 1.2.3 or 1.2.3-next.1.`,
    )
  }
}
