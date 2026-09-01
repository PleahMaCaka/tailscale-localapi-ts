---
title: "@tailnet/headscale"
description: The Headscale control plane, and what only it can do.
sidebar:
  order: 2
---

```typescript
import { Headscale } from "@tailnet/headscale"

const control = new Headscale({ url: "http://127.0.0.1:8080", apiKey })
```

`url` is the server root; the `/api/v1` prefix is added for you. Everything
in the [shared contract](../tailnet/) works. What follows is what Headscale
adds, with full signatures on
[Headscale](../../api/tailnet/headscale/classes/headscale/).

## Renaming a node

Headscale stores a given name per node, so unlike Tailscale it can rename.

```typescript
await control.nodes.rename(id, "build-box")
```

## Nodes by user, ownership and registration

```typescript
await control.nodes.byUser("dev")
await control.nodes.moveToUser(nodeId, userId)
await control.nodes.register(userId, nodeKey)
```

Ownership decides which ACL rules apply, so moving a node can change access
in both directions. `register` completes a machine that is waiting with a
node key, the API form of `headscale nodes register`.

## Writing user records

```typescript
await control.users.create({ name: "ci" })
await control.users.rename(id, "ci-runner")
await control.users.byId(id)
await control.users.byName("ci")
await control.users.delete(id)
```

`delete` fails while the user still owns nodes. Move or delete those first.
Renaming breaks ACL rules that name the old user, so change the policy in the
same step.

## API keys

Keys that grant access to Headscale itself. Tailscale manages these through its
admin console instead.

```typescript
await control.apiKeys.fetch()          // prefixes only, never secrets
await control.apiKeys.create(seconds)  // returned once, default 90 days
await control.apiKeys.expire(prefix)
await control.apiKeys.delete(prefix)
```

Expiring the key you are calling with cuts you off mid-session.

## Keys are scoped per user

Headscale calls them pre-auth keys and every one belongs to a user, so
`keys.fetch()` needs an id:

```typescript
await control.keys.fetch(userId)
await control.keys.create({ userId, reusable: true, tags: ["tag:edge"] })
```

Calling `keys.fetch()` with no argument throws rather than guessing. A key
created without `expirySeconds` lasts 24 hours.

## Two traps worth knowing

**Filtering nodes by user takes a name, not an id.** It is the one endpoint in
the whole API that does, and passing an id fails with `user not found`.

```typescript
await control.nodes.byUser("dev")    // works
await control.nodes.byUser("1")      // "user not found"
```

**The policy endpoints need database mode.** With Headscale's default file
mode the server owns the policy and `policy.fetch()` fails. Set it in the
config:

```yaml
policy:
  mode: database
```

This is the same condition that makes Headplane show the Headscale
configuration as read-only.

## Raw shapes

`raw` on every node, user and key is the server's own object:
[HeadscaleNode](../../api/tailnet/headscale/interfaces/headscalenode/),
[HeadscaleUser](../../api/tailnet/headscale/interfaces/headscaleuser/),
[HeadscalePreAuthKey](../../api/tailnet/headscale/interfaces/headscalepreauthkey/).
These came from a running server, not from the protobuf definitions, so the
field names are what the JSON gateway actually emits.
