---
title: "@tailnet/headscale"
description: Headscale control plane client and its Headscale-only methods.
sidebar:
  order: 2
---

```typescript
import { Headscale } from "@tailnet/headscale"

const control = new Headscale({ url: "http://127.0.0.1:8080", apiKey })
```

`url` is the server root. The client adds the `/api/v1` prefix. All methods
of the [shared interface](../tailnet/) are available. This page covers the
methods specific to Headscale. Full signatures:
[Headscale](../../api/tailnet/headscale/classes/headscale/).

## Renaming a node

Headscale stores a given name per node, so nodes can be renamed. Tailscale
cannot.

```typescript
await control.nodes.rename(id, "build-box")
```

## Nodes by user, ownership and registration

```typescript
await control.nodes.byUser("dev")
await control.nodes.moveToUser(nodeId, userId)
await control.nodes.register(userId, nodeKey)
```

Ownership determines which ACL rules apply, so moving a node can change its
access in both directions. `register` completes registration for a machine
waiting with a node key. It is the API equivalent of
`headscale nodes register`.

## Users

```typescript
await control.users.create({ name: "ci" })
await control.users.rename(id, "ci-runner")
await control.users.byId(id)
await control.users.byName("ci")
await control.users.delete(id)
```

`delete` fails while the user still owns nodes. Move or delete the nodes
first. Renaming a user breaks ACL rules that reference the old name, so
update the policy at the same time.

## API keys

Keys for the Headscale API itself. Tailscale has no equivalent endpoint; its
API keys are managed in the admin console.

```typescript
await control.apiKeys.fetch()          // prefixes only, no secrets
await control.apiKeys.create(seconds)  // returned once, default 90 days
await control.apiKeys.expire(prefix)
await control.apiKeys.delete(prefix)
```

Expiring the key the client is using makes every following request fail.

## Pre-auth keys

Every pre-auth key belongs to a user, so `keys.fetch()` requires a user id:

```typescript
await control.keys.fetch(userId)
await control.keys.create({ userId, reusable: true, tags: ["tag:edge"] })
```

`keys.fetch()` throws when called without an id. A key created without
`expirySeconds` expires after 24 hours.

## Known pitfalls

**`nodes.byUser` takes a user name, not an id.** It is the only endpoint in
the API that filters by name. Passing an id fails with `user not found`.

```typescript
await control.nodes.byUser("dev")    // works
await control.nodes.byUser("1")      // "user not found"
```

**The policy endpoints require database mode.** With Headscale's default
file mode the policy endpoints fail. Set the mode in the config:

```yaml
policy:
  mode: database
```

Headplane shows the Headscale configuration as read-only for the same reason.

## Raw types

`raw` on every node, user and key holds the server's original object:
[HeadscaleNode](../../api/tailnet/headscale/interfaces/headscalenode/),
[HeadscaleUser](../../api/tailnet/headscale/interfaces/headscaleuser/),
[HeadscalePreAuthKey](../../api/tailnet/headscale/interfaces/headscalepreauthkey/).
These types were captured from a running server, not derived from the
protobuf definitions, so the field names match what the JSON gateway emits.
