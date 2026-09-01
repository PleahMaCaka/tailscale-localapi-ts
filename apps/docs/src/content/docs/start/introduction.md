---
title: Introduction
description: What tailnet is, and the one idea behind it.
sidebar:
  order: 1
---

tailnet is a TypeScript client for the two places a tailnet is managed
from: the control plane, and the daemon on the machine you are on.

```typescript
import { Headscale } from "@tailnet/headscale"
import { Tailscaled } from "@tailnet/tailscaled"

const control = new Headscale({ url, apiKey })
const daemon = new Tailscaled()

await control.nodes.fetch()          // every machine the control plane knows
await daemon.status()                // what this machine thinks is going on
```

## One base class, two control planes

Tailscale's hosted API and a self-hosted Headscale do the same job with
different endpoints, shapes and quirks. `Headscale` and `Tailscale` both
extend `Tailnet`, so anything written against `Tailnet` runs on either:

```typescript
import type { Tailnet } from "@tailnet/headscale"

async function tagged(control: Tailnet, tag: string) {
  const nodes = await control.nodes.fetch()

  return nodes.filter(n => n.tags.includes(tag))
}
```

What only one of them can do lives on that class alone: `Headscale` writes
user records and manages API keys, `Tailscale` has a DNS API and device
authorization. Nothing is stubbed to fail at runtime.

## The daemon is a different thing

`@tailnet/tailscaled` talks to the local `tailscaled` over its unix socket. It
answers questions no control plane can: what this machine's preferences are,
which exit node it uses, whether it is logged in. It shares no types with the
control-plane packages because the two APIs share no endpoints.

## Tailcat needs neither

`@tailnet/tailcat` drives Tailscale's [tailcat](https://github.com/tailscale/tailcat)
CLI: a WireGuard tunnel between two machines bootstrapped through a DERP
relay, with no account and no control plane at all. One side serves, the
other connects with the printed address.

## Every call tells you what it can break

Reads have no risk line. Writes carry `Risk: **write**`. Calls that take
something offline or delete it carry `Risk: **breaking**`. Your editor shows
the line on hover, and the [risk levels](../risk-levels/) page has the rest.

## What it is not

- Not a `tailscale` CLI wrapper. On Linux it speaks HTTP to the socket
  directly; the CLI is only a fallback where the socket is out of reach.
- Not an ORM over the tailnet. Shared shapes keep the fields both control
  planes agree on and hand you the rest in `raw`.
- Not tested against a production Tailscale tailnet. See the
  [@tailnet/tailscale](../../reference/tailscale/) page for what that means.
