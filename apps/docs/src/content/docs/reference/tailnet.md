---
title: "@tailnet/core"
description: The shared contract every control plane implements.
sidebar:
  order: 1
---

`Tailnet` is the abstract class `Headscale` and `Tailscale` extend. Type
against it and either one fits. You never install this package yourself:
everything in it is re-exported from `@tailnet/headscale` and
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

Both control planes normalise onto one
[TailnetNode](../../api/tailnet/core/interfaces/tailnetnode/). Its `raw` field
is the server's own object, for anything the shared shape drops.

**Renaming is optional.** Tailscale has no rename endpoint: a device's name
comes from the machine itself. So `rename` is optional on the interface and
`canRename` tells you whether it is there.

```typescript
if (control.canRename) {
  await control.nodes.rename?.(id, "build-box")
}
```

**Routes take two steps.** A route only carries traffic once the node
advertises it *and* an administrator enables it. `advertisedRoutes` is set on
the machine and cannot be changed through any API; `setRoutes` controls
`enabledRoutes`.

## Users

```typescript
await control.users.fetch()
```

Read-only in the shared contract, because Tailscale users come from an identity
provider. `Headscale` owns its user records and adds create, rename and delete
on its own `users`.

## Keys

```typescript
const key = await control.keys.create({ userId, reusable: true, tags: ["tag:edge"] })
key.secret   // the only time you get it

await control.keys.fetch(userId)
await control.keys.revoke(key)
```

`revoke` takes the whole key rather than an id, because the two control planes
identify keys differently: Tailscale by id, Headscale by owner plus secret.
Revoking blocks new registrations only; machines already on the tailnet stay.

## Policy

```typescript
const current = await control.policy.fetch()
await control.policy.set(document, current.version)
```

`version` is Tailscale's `ETag`, sent back as `If-Match` so a concurrent edit
is rejected instead of silently overwritten. Headscale has no such token and
ignores the argument. `set` is the whole tailnet's firewall in one call: both
control planes reject a malformed document, neither rejects a valid but wrong
one.

## Errors

Everything throws a subclass of
[TailnetError](../../api/tailnet/core/classes/tailneterror/).

| Class | Raised when |
| --- | --- |
| `ServerUnreachableError` | The connection was refused. Carries `url`. |
| `UnauthorizedError` | 401 or 403. Bad or insufficient credentials. |
| `NotFoundError` | 404. |
| `InvalidRequestError` | 400 or 422. The server rejected the request body. |
| `ConflictError` | 409 or 412. Usually a stale policy version. |
| `ApiError` | Anything else. Carries `status`. |
