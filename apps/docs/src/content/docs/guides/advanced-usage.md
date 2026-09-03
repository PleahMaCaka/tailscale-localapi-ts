---
title: Advanced usage
description: Writing against Tailnet, narrowing to one control plane, error handling, and daemon options.
sidebar:
  order: 1
---

## Narrowing to one control plane

Write against `Tailnet` for shared operations. When a code path needs a
method that exists on only one control plane, narrow with `instanceof`:

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

`control.name` is `"headscale"` or `"tailscale"`. `control.canRename`
reports whether `nodes.rename` is available, the one optional method on the
shared interface.

## Choosing the control plane from the environment

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

## Error classes

Every error thrown by a control plane client extends `TailnetError`, so one
`instanceof` check separates API errors from other exceptions:

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

`ServerUnreachableError` has a `url` field and `ApiError` has `status`. The
daemon client has a separate hierarchy under `TailscaledError`.

## Policy versioning

Tailscale returns an `ETag` with the policy and rejects a write whose
`If-Match` header is stale. Pass `version` from the fetched document back to
`set`:

```typescript
const current = await control.policy.fetch()
const next = current.policy.replace("tag:old", "tag:new")

try {
  await control.policy.set(next, current.version)
} catch (error) {
  if (error instanceof ConflictError) {
    // the policy changed since fetch; fetch again and retry
  }
}
```

Headscale has no version token and ignores the argument, so the same code
works on both.

## Listing keys on Headscale

Headscale scopes pre-auth keys to a user, and `keys.fetch()` throws when
called without a user id. To list all keys on either control plane:

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

## Raw server objects

Every node, user and key has the server's original object on `raw`. Cast it
to the package's type to read fields the shared type does not include:

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

## Daemon client

### Login without a browser

`login()` returns immediately. The URL to open is reported by `status()`:

```typescript
await daemon.login()

const { authUrl } = await daemon.status(false)
console.log(authUrl)
```

With an auth key there is no interactive step:

```typescript
await daemon.start({ authKey })
```

### Editing one preference

Pass only the fields to change. The `Set` mask the daemon requires is
generated from the keys in the patch:

```typescript
await daemon.prefs.edit({ exitNodeId: peer.id, exitNodeAllowLanAccess: true })
```

### Forcing the CLI transport

`useCli: true` runs `tailscale debug localapi` on every platform. Use it when
the socket requires root but the CLI is permitted:

```typescript
const daemon = new Tailscaled({ useCli: true })
```

### Checking that the daemon is running

`isRunning()` returns `false` instead of throwing when the connection fails:

```typescript
if (!(await daemon.isRunning())) return "stopped"
```
