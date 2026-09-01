---
title: tailnet.ts
description: The shared contract every control plane implements.
sidebar:
  order: 1
---

`Tailnet` holds a backend and exposes its operations. It adds no behaviour of
its own, so there is no wrapper to see through.

```typescript
const control = new Tailnet(headscale({ url, apiKey }))

control.nodes    // NodeOps
control.users    // UserOps
control.keys     // KeyOps
control.policy   // PolicyOps
control.backend  // the concrete backend, still fully typed
```

## Nodes

```typescript
await control.nodes.fetch()                       // every node
await control.nodes.fetch(id)                     // one node
await control.nodes.setTags(id, ["tag:server"])   // write
await control.nodes.setRoutes(id, ["10.0.0.0/8"]) // write
await control.nodes.expire(id)                    // danger
await control.nodes.delete(id)                    // danger
```

Both backends normalise onto one shape:

```typescript
interface TailnetNode {
  id: string
  name: string
  fqdn: string
  owner: { id: string; name: string }
  addresses: string[]
  tags: string[]
  online: boolean
  lastSeen: string | null
  expires: string | null
  advertisedRoutes: string[]
  enabledRoutes: string[]
  os: string
  clientVersion: string
  raw: unknown
}
```

`raw` is the backend's own object, for anything this shape drops.

### Renaming is optional

Tailscale has no rename endpoint: a device's name comes from the machine
itself. So `rename` is optional on the interface, and `canRename` tells you
whether the backend has it.

```typescript
if (control.canRename) {
  await control.nodes.rename?.(id, "build-box")
}
```

### Routes take two steps

A route only carries traffic once the node advertises it *and* an
administrator enables it. `advertisedRoutes` is set on the machine and cannot
be changed through any API; `setRoutes` controls `enabledRoutes`.

## Users

```typescript
await control.users.fetch()
```

Read-only in the shared contract, because Tailscale users come from an identity
provider. Headscale owns its user records and can write them, through
`control.backend.users`.

## Keys

```typescript
const key = await control.keys.create({ userId, reusable: true, tags: ["tag:edge"] })
console.log(key.secret)   // the only time you get it

await control.keys.fetch(userId)
await control.keys.revoke(key)
```

`revoke` takes the whole key rather than an id, because the two backends
identify keys differently: Tailscale by id, Headscale by owner plus secret.

## Policy

```typescript
const current = await control.policy.fetch()
await control.policy.set(document, current.version)
```

`version` is Tailscale's `ETag`, sent back as `If-Match` so a concurrent edit
is rejected instead of silently overwritten. Headscale has no such token and
ignores the argument.

## Errors

Everything throws a subclass of `TailnetError`.

| Class | Raised when |
| --- | --- |
| `ServerUnreachableError` | The connection was refused. Carries `url`. |
| `UnauthorizedError` | 401 or 403. Bad or insufficient credentials. |
| `NotFoundError` | 404. |
| `InvalidRequestError` | 400 or 422. The server rejected the request body. |
| `ConflictError` | 409 or 412. Usually a stale policy version. |
| `ApiError` | Anything else. Carries `status`. |
