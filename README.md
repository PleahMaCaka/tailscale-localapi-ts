# Tailscale LocalAPI TypeScript Client

TypeScript client for Tailscale LocalAPI built with Bun.

## Features

- **Linux support**: Unix socket connection to Tailscale daemon
- **Full API coverage**: status, whois, prefs, DERP map, DNS, metrics, profiles, and more
- **Type-safe**: Comprehensive TypeScript definitions matching Tailscale API
- **Bun-native**: Optimized for Bun runtime

## Installation

```bash
bun install
```

## Quick Start

```typescript
import TailscaleLocalAPI from "./src/index"

const client = new TailscaleLocalAPI()

// Get current status
const status = await client.status()
console.log("Backend state:", status.BackendState)
console.log("Self:", status.Self?.DNSName)
```

## Platform Support

### Linux
Uses Unix socket at `/var/run/tailscale/tailscaled.sock` by default.

```typescript
const client = new TailscaleLocalAPI({
  socketPath: "/var/run/tailscale/tailscaled.sock",
})
```

### Environment Variables

| Variable                    | Description              |
| ----------------------------- | ------------------------ |
| `TAILSCALE_LOCALAPI_SOCKET`   | Unix socket path (Linux) |

## API Methods

### Status & Info

```typescript
// Get full status with peers
const status = await client.status()

// Get status without peers (faster)
const status = await client.statusWithoutPeers()
```

### WhoIs Lookup

```typescript
// Lookup peer information by IP
const whois = await client.whois("100.x.x.x")
console.log("User:", whois.UserProfile.LoginName)
console.log("Node:", whois.Node.Name)
```

### Preferences

```typescript
// Get current preferences
const prefs = await client.getPrefs()

// Edit preferences
await client.editPrefs({
  ExitNodeID: "some-node-id",
  AcceptRoutes: true,
})

// Validate preferences
const validation = await client.checkPrefs(prefs)
```

### DERP Map

```typescript
// Get DERP relay configuration
const derpMap = await client.getDERPMap()
derpMap.Regions.forEach((region) => {
  console.log(`Region ${region.RegionName}: ${region.Nodes.length} nodes`)
})
```

### DNS

```typescript
// Query DNS
const dnsResult = await client.queryDNS("example.com", "A")
console.log("Resolvers:", dnsResult.Resolvers)

// Get system DNS configuration
const dnsConfig = await client.getDNSOSConfig()
console.log("Nameservers:", dnsConfig.Nameservers)
```

### Profiles

```typescript
// Get current profile
const current = await client.getCurrentProfile()

// Get all profiles
const profiles = await client.getProfiles()

// Switch profile
await client.switchProfile("profile-id")
```

### Authentication (⚠️ Dangerous)

```typescript
// Start interactive login
await client.loginInteractive()

// Logout (may log you out)
await client.logout()

// Reset auth (may require re-authentication)
await client.resetAuth()
```

### Control (⚠️ Dangerous)

```typescript
// Start Tailscale
await client.start({ HostName: "my-device" })

// Reload configuration
const result = await client.reloadConfig()

// Shutdown Tailscale
await client.shutdown()
```

### System Checks

```typescript
// Check IP forwarding
const ipForwarding = await client.checkIPForwarding()

// Check SO_MARK usage
const soMark = await client.checkSOMarkInUse()
```

## Testing

Run the test suite to verify functionality:

```bash
bun test
```

Note: Tests are designed to work with an active Tailscale daemon and may be skipped if not available.

## Error Handling

```typescript
import {
  AccessDeniedError,
  PeerNotFoundError,
  PreconditionsFailedError,
} from "./src/index"

try {
  await client.whois("invalid-ip")
} catch (error) {
  if (error instanceof AccessDeniedError) {
    console.error("Access denied")
  } else if (error instanceof PeerNotFoundError) {
    console.error("Peer not found")
  } else if (error instanceof PreconditionsFailedError) {
    console.error("Preconditions failed")
  } else {
    console.error("Unknown error:", error)
  }
}
```

## Debug Tool

Run `debug.ts` to get a comprehensive overview of your Tailscale setup, including status, profiles, preferences, DERP map, and all tailnet devices:

```bash
bun debug.ts
```

## Configuration

```typescript
interface ClientOptions {
  socketPath?: string // Unix socket path (Linux)
  timeout?: number // Request timeout in ms (default: 30000)
}
```

## License

[MIT License](./LICENSE)
