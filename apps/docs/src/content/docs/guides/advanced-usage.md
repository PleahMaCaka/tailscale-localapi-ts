---
title: Advanced usage
description: Writing against Tailnet, narrowing to one control plane, and the edges worth knowing.
sidebar:
  order: 1
---

## Narrow when you need the extras

Write against `Tailnet` for the shared work. When a code path needs something
only one control plane has, narrow with `instanceof`:

```typescript
import { Headscale, type Tailnet } from "@tailnet/headscale"
import { Tailscale } from "@tailnet/tailscale"

async function nameservers(control: Tailnet) {
  if (control instanceof Tailscale) return control.dns.nameservers()

  return null
}

function requireHeadscale(control: Tailnet): Headscale {
  if (!(control instanceof Headscale)) throw new Error("Headscale only")

  return control
}
```

`control.name` is `"headscale"` or `"tailscale"` when a string is enough,
and `control.canRename` covers the one optional method on the shared
contract.

## Pick the control plane from the environment

```typescript
function fromEnv(): Tailnet {
  if (process.env.HEADSCALE_API_KEY) {
    return new Headscale({
      url: process.env.HEADSCALE_URL ?? "http://127.0.0.1:8080",
      apiKey: process.env.HEADSCALE_API_KEY
    })
  }

  return new Tailscale({
    tailnet: process.env.TAILSCALE_TAILNET,
    apiKey: process.env.TAILSCALE_API_KEY!
  })
}
```

## Handle errors by class

Everything a control plane throws extends `TailnetError`, so one `instanceof`
separates "the server said no" from "your code is wrong":

```typescript
import { ConflictError, NotFoundError, TailnetError } from "@tailnet/headscale"

try {
  await control.nodes.delete(id)
} catch (error) {
  if (error instanceof NotFoundError) return
  if (error instanceof TailnetError) console.error(error.message)
  else throw error
}
```

`ServerUnreachableError` carries the `url` it tried, `ApiError` the `status`.
The daemon client has its own tree under `TailscaledError`.

## Edit the policy without clobbering someone else

Tailscale returns an `ETag` with the policy and rejects a write whose
`If-Match` is stale. Always round-trip `version`:

```typescript
const current = await control.policy.fetch()
const next = current.policy.replace("tag:old", "tag:new")

try {
  await control.policy.set(next, current.version)
} catch (error) {
  if (error instanceof ConflictError) {
    // someone else changed the policy first; fetch and try again
  }
}
```

Headscale has no token and ignores the argument, so the same code is correct
on both.

## Keys on Headscale need a user

Headscale scopes pre-auth keys to a user and `keys.fetch()` throws without
one. To list every key on either control plane:

```typescript
async function allKeys(control: Tailnet) {
  if (control instanceof Headscale) {
    const users = await control.users.fetch()
    const perUser = await Promise.all(users.map(u => control.keys.fetch(u.id)))

    return perUser.flat()
  }

  return control.keys.fetch()
}
```

## Reach for `raw` when the shared shape is not enough

Every node, user and key keeps the server's own object on `raw`. Cast it to
the package's type when you need a field the shared shape drops:

```typescript
import type { HeadscaleNode } from "@tailnet/headscale"

const node = await control.nodes.fetch(id)
const registered = (node.raw as HeadscaleNode).registerMethod
```

## Timeouts, proxies, mocks

Both constructors take `timeout` in milliseconds, default 15 seconds.
`Tailscale` also takes `baseUrl` for a proxy or a stub server:

```typescript
new Tailscale({ apiKey, baseUrl: "http://127.0.0.1:9999/api/v2" })
```

The unit tests in `packages/tailscale/tests/unit` stub `fetch` this way.

## The daemon

**Log in without a browser on the machine.** `login()` returns at once; the
URL to open shows up on `status()`:

```typescript
await daemon.login()

const { authUrl } = await daemon.status(false)
console.log(authUrl)
```

With an auth key there is no prompt at all:

```typescript
await daemon.start({ authKey })
```

**Change one preference.** Pass only the fields you mean to change; the
`Set` mask the daemon requires is built for you:

```typescript
await daemon.prefs.edit({ exitNodeId: peer.id, exitNodeAllowLanAccess: true })
```

**Force the transport.** `useCli: true` shells out to `tailscale debug
localapi` anywhere, which is the way to reach a daemon whose socket needs
root while the CLI is allowed through:

```typescript
const daemon = new Tailscaled({ useCli: true })
```

**Guard before calling.** `isRunning()` swallows the connection error so a
status page can show "daemon stopped" instead of throwing:

```typescript
if (!(await daemon.isRunning())) return "stopped"
```
