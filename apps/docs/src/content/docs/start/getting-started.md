---
title: Getting started
description: Pick the packages you need and make the first call.
sidebar:
  order: 2
---

| Package | Talks to | Use it for |
| --- | --- | --- |
| `@tailnet/core` | nothing on its own | The shared contract, types and errors |
| `@tailnet/headscale` | a Headscale server | Self-hosted control plane |
| `@tailnet/tailscale` | `api.tailscale.com` | Tailscale's hosted control plane |
| `@tailnet/tailscaled` | the LocalAPI unix socket | The tailscaled daemon on this machine |
| `@tailnet/tailcat` | the `tailcat` binary | Tunnels between two machines with no control plane |

## A control plane

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

Tailscale is the same shape with a different constructor:

```typescript
import { Tailscale } from "@tailnet/tailscale"

const control = new Tailscale({ apiKey: process.env.TAILSCALE_API_KEY! })
```

The key's own tailnet is used unless you pass `tailnet: "example.com"`.
Both classes extend `Tailnet`, re-exported from either package, so code
typed against `Tailnet` accepts either.

## The local daemon

```bash
bun add @tailnet/tailscaled
```

```typescript
import { Tailscaled } from "@tailnet/tailscaled"

const daemon = new Tailscaled()

const status = await daemon.status()
console.log(status.backendState, status.self.dnsName)
```

Needs Bun: the socket is reached through `fetch({ unix })`. The path comes
from `TAILSCALE_LOCALAPI_SOCKET` when set. On Windows and macOS, where the
socket is out of reach, it shells out to `tailscale debug localapi` instead.

## Getting an API key

```bash
headscale apikeys create --expiration 24h
```

For Tailscale, generate an access token in the admin console under Settings,
Keys.

## Where next

- [Risk levels](../risk-levels/), the one convention every method follows.
- One page per package under Packages: what it adds, what it cannot do, and
  the traps worth knowing before the first call.
- The [API reference](../../api/), generated from the TSDoc in the source.
