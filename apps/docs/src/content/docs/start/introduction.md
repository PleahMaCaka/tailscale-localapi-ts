---
title: Introduction
description: What tailnet is and how the packages fit together.
sidebar:
  order: 1
---

tailnet is a set of TypeScript clients for Tailscale and Headscale control
planes, for the `tailscaled` daemon on the local machine, and for the tailcat
CLI.

```typescript
import { Headscale } from "@tailnet/headscale"
import { Tailscaled } from "@tailnet/tailscaled"

const control = new Headscale({ url, apiKey })
const daemon = new Tailscaled()

await control.nodes.fetch()          // nodes known to the control plane
await daemon.status()                // this machine's own state
```

## Control planes

Tailscale's hosted API and a self-hosted Headscale server expose different
endpoints and response shapes for the same operations. `Headscale` and
`Tailscale` both extend `Tailnet`, so code written against `Tailnet` works
with either:

```typescript
import type { Tailnet } from "@tailnet/headscale"

async function tagged(control: Tailnet, tag: string) {
  const nodes = await control.nodes.fetch()

  return nodes.filter(n => n.tags.includes(tag))
}
```

Operations that exist on only one control plane live on that class.
`Headscale` can create, rename and delete users and manage API keys.
`Tailscale` has DNS settings and device authorization. The shared class
declares no method that one side cannot implement.

## Local daemon

`@tailnet/tailscaled` talks to the `tailscaled` on the same machine over its
unix socket. It exposes the daemon's own state: preferences, exit node, login
status. It shares no types with the control-plane packages because the two
APIs have no endpoints in common.

## Tailcat

`@tailnet/tailcat` runs Tailscale's [tailcat](https://github.com/tailscale/tailcat)
CLI. Tailcat opens a WireGuard tunnel between two machines through a DERP
relay, with no account and no control plane. One side serves and prints an
address, the other side connects with it.

## Risk lines

Methods that only read have no risk line. Methods that write carry
`Risk: **write**` in their TSDoc. Methods that take something offline or
delete it carry `Risk: **breaking**`. Editors show the line on hover. See
[risk levels](../risk-levels/).

## Scope

- The daemon client is not a wrapper around the `tailscale` CLI. On Linux it
  sends HTTP to the socket directly. The CLI is used only on Windows and
  macOS, where Bun cannot open the socket.
- Shared node, user and key types contain only the fields both control planes
  provide. The server's full object is available as `raw`.
- `@tailnet/tailscale` is not tested against a live Tailscale tailnet. See
  [@tailnet/tailscale](../../reference/tailscale/).
