---
title: Getting started
description: Install the packages you need and make the first call.
sidebar:
  order: 2
---

| Package | Talks to | Use it for |
| --- | --- | --- |
| `@tailnet/core` | nothing on its own | The shared interface, types and errors |
| `@tailnet/headscale` | a Headscale server | Self-hosted control plane |
| `@tailnet/tailscale` | `api.tailscale.com` | Tailscale's hosted control plane |
| `@tailnet/tailscaled` | the LocalAPI unix socket | The tailscaled daemon on this machine |
| `@tailnet/tailcat` | the `tailcat` binary | Tunnels between two machines with no control plane |

## Control plane

```bash
bun add @tailnet/headscale
```

```typescript
import { Headscale } from "@tailnet/headscale"

const control = new Headscale({
  url: "http://127.0.0.1:8080",
  apiKey: process.env.HEADSCALE_API_KEY!
})

for (const node of await control.nodes.fetch()) {
  console.log(node.name, node.addresses, node.online)
}
```

`Tailscale` has the same interface and a different constructor:

```typescript
import { Tailscale } from "@tailnet/tailscale"

const control = new Tailscale({ apiKey: process.env.TAILSCALE_API_KEY! })
```

Requests go to the tailnet that owns the API key unless
`tailnet: "example.com"` is passed. Both classes extend `Tailnet`, which is
re-exported from either package, so code typed against `Tailnet` accepts
either.

## Local daemon

```bash
bun add @tailnet/tailscaled
```

```typescript
import { Tailscaled } from "@tailnet/tailscaled"

const daemon = new Tailscaled()

const status = await daemon.status()
console.log(status.backendState, status.self.dnsName)
```

This package requires Bun, because it reaches the socket through
`fetch({ unix })`. The socket path comes from `TAILSCALE_LOCALAPI_SOCKET`
when set. On Windows and macOS, where Bun cannot open the socket, the client
runs `tailscale debug localapi` instead.

## API keys

```bash
headscale apikeys create --expiration 24h
```

For Tailscale, generate an access token in the admin console under Settings,
Keys.

## Next

- [Risk levels](../risk-levels/), the TSDoc convention that marks writes and
  breaking calls.
- The package pages under Packages: what each adds beyond the shared
  interface, and known pitfalls.
- The [API reference](../../api/), generated from the TSDoc in the source.
