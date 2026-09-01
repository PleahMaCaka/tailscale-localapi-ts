---
title: Installation
description: Pick the packages you need and make the first call.
sidebar:
  order: 1
---

Four packages, each doing one thing.

| Package | Talks to | Use it for |
| --- | --- | --- |
| `tailnet.ts` | nothing on its own | The shared contract and types |
| `headscale.ts` | a Headscale server | Self-hosted control plane |
| `tailscale.ts` | `api.tailscale.com` | Tailscale's hosted control plane |
| `tailscaled.ts` | the local unix socket | The daemon on this machine |

## A control plane

```bash
bun add tailnet.ts headscale.ts
```

```typescript
import { Tailnet } from "tailnet.ts"
import { headscale } from "headscale.ts"

const control = new Tailnet(
  headscale({ url: "http://127.0.0.1:8080", apiKey: process.env.HEADSCALE_API_KEY! })
)

for (const node of await control.nodes.fetch()) {
  console.log(node.name, node.addresses, node.online)
}
```

Swapping to Tailscale changes the constructor and nothing else:

```typescript
import { tailscale } from "tailscale.ts"

const control = new Tailnet(
  tailscale({ tailnet: "-", apiKey: process.env.TAILSCALE_API_KEY! })
)
```

`tailnet: "-"` means the default tailnet of whoever owns the key.

## The local daemon

```bash
bun add tailscaled.ts
```

```typescript
import { Tailscaled } from "tailscaled.ts"

const daemon = new Tailscaled()

const status = await daemon.status()
console.log(status.backendState, status.self.dnsName)
```

This one needs the Bun runtime: the daemon socket is reached through Bun's
`fetch({ unix })`. On Windows and macOS it falls back to the `tailscale` CLI
automatically.

## Getting an API key

```bash
headscale apikeys create --expiration 24h
```

For Tailscale, generate an access token in the admin console under Settings,
Keys.
