const WORD = /[A-Z]+s(?![a-z])|[A-Z]+(?![a-z])|[A-Z][a-z]*|[a-z]+|\d+/g

const UNSPLITTABLE: Record<string, string> = {
  IPv4: "ipv4",
  IPv6: "ipv6",
  PeerAPIURL: "peerApiUrl",
  MagicDNSName: "magicDnsName"
}

export function toCamelCase(key: string): string {
  const known = UNSPLITTABLE[key]
  if (known) return known

  const words = key.match(WORD)
  if (!words) return key

  return words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("")
}

export function toPascalCase(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function camelizeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(camelizeKeys)

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {}
    for (const [key, nested] of Object.entries(value)) {
      out[toCamelCase(key)] = camelizeKeys(nested)
    }

    return out
  }

  return value
}
