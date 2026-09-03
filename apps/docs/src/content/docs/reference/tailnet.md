---
title: "@tailnet/core"
description: The shared interface every control plane implements.
sidebar:
  order: 1
---

`Tailnet` is the abstract class that `Headscale` and `Tailscale` extend.
Code typed against `Tailnet` accepts either. This package is not installed
directly. Everything in it is re-exported from `@tailnet/headscale` and
`@tailnet/tailscale`.

```typescript
import type { Tailnet } from "@tailnet/headscale"

function offline(control: Tailnet) {
  return control.nodes.fetch().then(nodes => nodes.filter(n => !n.online))
}
```

```typescript
control.name       // "headscale" or "tailscale"
control.nodes      // NodeOps
control.users      // UserOps
control.keys       // KeyOps
control.policy     // PolicyOps
control.canRename  // whether nodes.rename exists
```

Full signatures: [Tailnet](../../api/tailnet/core/classes/tailnet/),
[NodeOps](../../api/tailnet/core/interfaces/nodeops/),
[UserOps](../../api/tailnet/core/interfaces/userops/),
[KeyOps](../../api/tailnet/core/interfaces/keyops/),
[PolicyOps](../../api/tailnet/core/interfaces/policyops/).

## Nodes

```typescript
await control.nodes.fetch()
await control.nodes.fetch(id)
await control.nodes.setTags(id, ["tag:server"])
await control.nodes.setRoutes(id, ["10.0.0.0/8"])
await control.nodes.expire(id)
await control.nodes.delete(id)
```

Both control planes return the same
[TailnetNode](../../api/tailnet/core/interfaces/tailnetnode/) type. Its
`raw` field holds the server's original object, including fields the shared
type omits.

`rename` is optional. Tailscale has no rename endpoint, because a device's
name comes from the machine. `canRename` reports whether `rename` is
implemented.

```typescript
if (control.canRename) {
  await control.nodes.rename?.(id, "build-box")
}
```

Routes have two sides. A route carries traffic only when the node advertises
it and an administrator enables it. `advertisedRoutes` is set on the machine
and cannot be changed through any API. `setRoutes` controls `enabledRoutes`.

## Users

```typescript
await control.users.fetch()
```

Users are read-only in the shared interface, because Tailscale users come
from an identity provider. `Headscale` adds create, rename and delete on its
own `users` property.

## Keys

```typescript
const key = await control.keys.create({ userId, reusable: true, tags: ["tag:edge"] })
key.secret   // returned only at creation

await control.keys.fetch(userId)
await control.keys.revoke(key)
```

`revoke` takes the whole key object instead of an id, because the two
control planes identify keys differently: Tailscale by id, Headscale by
owner and secret. Revoking a key blocks new registrations. Machines already
registered with it stay on the tailnet.

## Policy

```typescript
const current = await control.policy.fetch()
await control.policy.set(document, current.version)
```

`version` is Tailscale's `ETag`, sent back as `If-Match` so a concurrent
edit is rejected instead of overwritten. Headscale has no version token and
ignores the argument. `set` replaces the whole policy. Both control planes
reject a malformed document. Neither rejects a valid document with wrong
rules.

## Errors

All errors are subclasses of
[TailnetError](../../api/tailnet/core/classes/tailneterror/).

| Class | Raised when |
| --- | --- |
| `ServerUnreachableError` | The connection was refused. Carries `url`. |
| `UnauthorizedError` | 401 or 403. Bad or insufficient credentials. |
| `NotFoundError` | 404. |
| `InvalidRequestError` | 400 or 422. The server rejected the request body. |
| `ConflictError` | 409 or 412. Usually a stale policy version. |
| `ApiError` | Anything else. Carries `status`. |
