import TailscaleLocalAPI, { type Device } from "./src/index"

async function main() {
  let output = "=== Tailscale LocalAPI Debug Tool ===\n\n"

  const client = new TailscaleLocalAPI()
  let allPassed = true

  function getProp<T = unknown>(obj: unknown, keys: string[]): T | undefined {
    if (!obj || typeof obj !== "object") return undefined
    const o = obj as Record<string, unknown>
    for (const k of keys) {
      if (Object.prototype.hasOwnProperty.call(o, k) && o[k] != null)
        return o[k] as T
    }
    return undefined
  }

  function formatIps(device: unknown): string {
    const raw = getProp(device, [
      "tailscaleIps",
      "TailscaleIPs",
      "tailscaleIPs",
      "TailscaleIps",
      "addrs",
      "Addrs",
      "addresses",
      "Addresses",
      "curAddr",
      "CurAddr",
      "ip",
      "IP",
      "ips",
      "IPs"
    ])

    if (Array.isArray(raw)) return (raw as string[]).join(", ")
    if (typeof raw === "string" && raw.length > 0) return raw
    if (raw == null) return "N/A"
    try {
      return String(raw)
    } catch {
      return "N/A"
    }
  }

  try {
    output += "1. Status:\n"
    const status = await client.status()
    output += `   Version: ${status.version}\n`
    output += `   Backend State: ${status.backendState}\n`

    if (status.backendState === "NeedsLogin") {
      output +=
        "   ❌ Not logged in. Please run 'tailscale up' to login and then re-run this tool.\n"
      if (status.authUrl) output += `   Auth URL: ${status.authUrl}\n`
      allPassed = false
    }

    output += `   Self: ${status.self?.dnsName} (${status.self?.tailscaleIps?.[0] || "N/A"})\n`
    output += `   Peers: ${Object.keys(status.peer || {}).length}\n`

    output += "\n2. Current Profile:\n"
    try {
      const profile = await client.getCurrentProfile()
      if (profile) {
        output += `   ID: ${profile.id}\n`
        output += `   Name: ${profile.name}\n`
        output += `   Login: ${profile.loginName || "N/A"}\n`
      } else {
        output += "   No profile found\n"
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      output += `   ❌ Failed to fetch profile: ${err.message || error}\n`
      allPassed = false
    }

    output += "\n3. Preferences:\n"
    try {
      const prefs = await client.getPrefs()
      const hostName = prefs?.hostName || prefs?.hostName || "N/A"
      output += `   HostName: ${hostName}\n`
    } catch (error: unknown) {
      const err = error as { message?: string }
      output += `   ❌ Failed to fetch preferences: ${err.message || error}\n`
      allPassed = false
    }

    output += "\n4. DERP Map:\n"
    try {
      const derpMap = await client.getDERPMap()
      const regionsCount = derpMap?.regions
        ? Object.keys(derpMap.regions).length
        : 0
      output += `   Regions: ${regionsCount}\n`
    } catch (error: unknown) {
      const err = error as { message?: string }
      output += `   ❌ Failed to fetch DERP map: ${err.message || error}\n`
      allPassed = false
    }

    output += "\n5. Tailnet Devices:\n"
    try {
      // Combine self and peers into devices list
      const devices: Device[] = [
        { ...status.self, isCurrent: true },
        ...Object.values(status.peer || {})
      ]

      if (devices.length === 0) {
        output += "   No devices found\n"
      } else {
        devices.forEach((device: Device, index: number) => {
          const name = device.dnsName || device.hostName || "Unknown"
          const ips = formatIps(device)
          const os = device.os || "Unknown"
          const online = device.online ? "Online" : "Offline"
          const lastSeen = device.lastSeen
            ? new Date(device.lastSeen).toLocaleString()
            : "N/A"

          const selfMark = device.isCurrent ? " (current device)" : ""
          const statusText = device.online
            ? online
            : `${online} (last seen: ${lastSeen})`

          output += `   ${index + 1}. ${name}${selfMark}\n`
          output += `      IPs: ${ips}\n`
          output += `      OS: ${os}\n`
          output += `      Status: ${statusText}\n`
          output += "\n" // Empty line for spacing
        })
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      output += `   ❌ Failed to list devices: ${err.message || error}\n`
      allPassed = false
    }

    output += `\n=== ${allPassed ? "All checks passed" : "Some checks failed (see above)"} ===\n`
    if (!allPassed) {
      output +=
        "\nNote: Some endpoints may not be available in CLI mode on Windows or this Tailscale version.\n"
    }

    console.log(output)
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("\n❌ Critical error:", err.message || error)
    process.exit(1)
  }
}

main()
