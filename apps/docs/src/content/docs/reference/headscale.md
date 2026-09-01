---
title: headscale.ts
description: The Headscale backend, and the four things only it can do.
sidebar:
  order: 2
---

```typescript
import { Tailnet } from "tailnet.ts"
import { headscale } from "headscale.ts"

const backend = headscale({ url: "http://127.0.0.1:8080", apiKey })
const control = new Tailnet(backend)
```

Everything in the [shared contract](/reference/tailnet/) works. What follows is
what Headscale adds, reachable through `control.backend`.

## Renaming a node

Headscale stores a given name per node, so unlike Tailscale it can rename.

```typescript
await control.nodes.rename?.(id, "build-box")
```

## Moving a node between users

```typescript
await control.backend.nodes.moveToUser(nodeId, userId)   // write
```

Ownership decides which ACL rules apply, so access can change in both
directions.

## Writing user records

```typescript
await control.backend.users.create({ name: "ci" })          // write
await control.backend.users.rename(id, "ci-runner")         // write
await control.backend.users.byName("ci")
await control.backend.users.delete(id)                      // danger
```

`delete` fails while the user still owns nodes. Move or delete those first.

## API keys

Keys that grant access to Headscale itself. Tailscale manages these through its
admin console instead.

```typescript
await control.backend.apiKeys.fetch()          // prefixes only, never secrets
await control.backend.apiKeys.create(iso)      // write, returned once
await control.backend.apiKeys.expire(prefix)   // danger
await control.backend.apiKeys.delete(prefix)   // danger
```

## Two traps worth knowing

**Filtering nodes by user takes a name, not an id.** It is the one endpoint in
the whole API that does, and passing an id fails with `user not found`.

```typescript
await control.backend.nodes.byUser("dev")    // works
await control.backend.nodes.byUser("1")      // "user not found"
```

**The policy endpoints need database mode.** With Headscale's default file
mode the server owns the policy and `policy.fetch()` fails. Set it in the
config:

```yaml
policy:
  mode: database
```

This is the same condition that makes Headplane show that the Headscale
configuration is read-only.

## Keys are scoped per user

Headscale calls them pre-auth keys and every one belongs to a user, so
`keys.fetch()` needs an id:

```typescript
await control.keys.fetch(userId)
await control.keys.create({ userId, reusable: true, tags: ["tag:edge"] })
```

Calling `keys.fetch()` with no argument throws rather than guessing.
