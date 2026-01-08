import TailscaleLocalAPI, { type Device } from "./src/index"

async function main() {
  console.log("=== Tailscale LocalAPI Debug Tool ===\n")

  const client = new TailscaleLocalAPI()
  let allPassed = true

  try {
    console.log("1. Status:")
    const status = await client.status()
    console.log(`   Version: ${status.Version}`)
    console.log(`   Backend State: ${status.BackendState}`)
    console.log(
      `   Self: ${status.Self?.DNSName} (${status.Self?.TailscaleIPs?.[0] || "N/A"})`
    )
    console.log(`   Peers: ${Object.keys(status.Peer || {}).length}`)

    console.log("\n2. Current Profile:")
    try {
      const profile = await client.getCurrentProfile()
      if (profile) {
        console.log(`   ID: ${profile.ID}`)
        console.log(`   Name: ${profile.Name}`)
        console.log(`   Login: ${profile.LoginName || "N/A"}`)
      } else {
        console.log("   No profile found")
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.log(`   ❌ Failed to fetch profile: ${err.message || error}`)
      allPassed = false
    }

    console.log("\n3. Preferences:")
    try {
      const prefs = await client.getPrefs()
      const hostName = prefs?.HostName || prefs?.HostName || "N/A"
      console.log(`   HostName: ${hostName}`)
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.log(`   ❌ Failed to fetch preferences: ${err.message || error}`)
      allPassed = false
    }

    console.log("\n4. DERP Map:")
    try {
      const derpMap = await client.getDERPMap()
      const regionsCount = derpMap?.Regions
        ? Object.keys(derpMap.Regions).length
        : 0
      console.log(`   Regions: ${regionsCount}`)
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.log(`   ❌ Failed to fetch DERP map: ${err.message || error}`)
      allPassed = false
    }

    console.log("\n5. Tailnet Devices:")
    try {
      // Combine self and peers into devices list
      const devices: Device[] = [
        { ...status.Self, isCurrent: true },
        ...Object.values(status.Peer || {})
      ]

      if (devices.length === 0) {
        console.log("   No devices found")
      } else {
        devices.forEach((device: Device, index: number) => {
          const name = device.DNSName || device.HostName || "Unknown"
          const ips = device.TailscaleIPs?.join(", ") || "N/A"
          const os = device.OS || "Unknown"
          const online = device.Online ? "Online" : "Offline"
          const lastSeen = device.LastSeen
            ? new Date(device.LastSeen).toLocaleString()
            : "N/A"

          const selfMark = device.isCurrent ? " (current device)" : ""
          const statusText = device.Online
            ? online
            : `${online} (last seen: ${lastSeen})`

          console.log(`   ${index + 1}. ${name}${selfMark}`)
          console.log(`      IPs: ${ips}`)
          console.log(`      OS: ${os}`)
          console.log(`      Status: ${statusText}`)
          console.log("") // Empty line for spacing
        })
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      console.log(`   ❌ Failed to list devices: ${err.message || error}`)
      allPassed = false
    }

    console.log(
      `\n=== ${allPassed ? "All checks passed" : "Some checks failed (see above)"} ===`
    )
    if (!allPassed) {
      console.log(
        "\nNote: Some endpoints may not be available in CLI mode on Windows or this Tailscale version."
      )
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error("\n❌ Critical error:", err.message || error)
    process.exit(1)
  }
}

main()
