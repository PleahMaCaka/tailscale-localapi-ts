const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1000]
]

export function timeAgo(timestamp: string | undefined, now = Date.now()) {
  if (!timestamp) return "never"

  const parsed = Date.parse(timestamp)
  // tailscaled sends Go's zero time for "this never happened"
  if (Number.isNaN(parsed) || parsed <= 0) return "never"

  const elapsed = parsed - now

  for (const [unit, size] of UNITS) {
    if (Math.abs(elapsed) >= size) {
      return relative.format(Math.round(elapsed / size), unit)
    }
  }

  return "just now"
}

export function bytes(count: number) {
  if (count < 1024) return `${count} B`

  const units = ["KB", "MB", "GB", "TB"]
  let value = count / 1024
  let unit = 0

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }

  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`
}

export function shortName(dnsName: string, hostName: string) {
  const [label] = dnsName.split(".")

  return label || hostName
}
