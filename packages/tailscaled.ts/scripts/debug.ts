import { DaemonUnreachableError, type Device, Tailscaled } from "../src"

const client = new Tailscaled()

function line(label: string, value: unknown) {
  console.log(`  ${label.padEnd(16)} ${value}`)
}

function lastSeen(device: Device): string {
  if (device.online) return "online"

  const seen = Date.parse(device.lastSeen)

  return Number.isNaN(seen) || seen <= 0
    ? "offline"
    : `offline since ${new Date(seen).toLocaleString()}`
}

async function main() {
  const status = await client.status()

  console.log("status")
  line("version", status.version)
  line("backend", status.backendState)
  line("tailnet", status.currentTailnet?.name ?? "unknown")
  line("self", status.self.dnsName)
  line("addresses", status.self.tailscaleIps.join(", "))

  if (status.backendState === "NeedsLogin") {
    console.log("\nNot logged in. Run `tailscale up` first.")
    if (status.authUrl) line("auth url", status.authUrl)
    process.exit(1)
  }

  const profile = await client.profiles.current()
  console.log("\nprofile")
  line("name", profile?.name ?? "none")
  line("login", profile?.userProfile.loginName ?? "none")
  line("control", profile?.controlUrl ?? "none")

  const prefs = await client.prefs.fetch()
  console.log("\nprefs")
  line("hostname", prefs.hostname || status.self.hostName)
  line("route all", prefs.routeAll)
  line("exit node", prefs.exitNodeId || "none")
  line("ssh", prefs.runSsh)

  const derpMap = await client.derpMap()
  console.log("\nderp")
  line("regions", Object.keys(derpMap.regions).length)
  line("home relay", status.self.relay || "none")

  const devices: Device[] = [
    { ...status.self, isSelf: true },
    ...Object.values(status.peer ?? {})
  ]

  console.log(`\ndevices (${devices.length})`)
  for (const device of devices) {
    const name = device.dnsName || device.hostName
    console.log(`  ${name}${device.isSelf ? " (this device)" : ""}`)
    line("  os", device.os || "unknown")
    line("  addresses", device.tailscaleIps.join(", ") || "none")
    line("  state", lastSeen(device))
  }
}

main().catch(error => {
  if (error instanceof DaemonUnreachableError) {
    console.error(error.message)
    console.error("Start tailscaled, or set TAILSCALE_LOCALAPI_SOCKET.")
    process.exit(1)
  }

  throw error
})
