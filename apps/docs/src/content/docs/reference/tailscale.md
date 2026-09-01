---
title: "@tailnet/tailscale"
description: The Tailscale control plane, and the DNS API Headscale has no answer for.
sidebar:
  order: 3
---

```typescript
import { Tailscale } from "@tailnet/tailscale"

const control = new Tailscale({ apiKey: process.env.TAILSCALE_API_KEY! })
```

The key's own tailnet is used unless you pass `tailnet: "example.com"`.
`baseUrl` overrides
`https://api.tailscale.com/api/v2` for a proxy or a mock. Full signatures on
[Tailscale](../../api/tailnet/tailscale/classes/tailscale/).

:::caution
Written against Tailscale's published OpenAPI schema and covered by unit tests
with a stubbed transport. Unlike Headscale it is not exercised against a live
server in this repository, because that would mean pointing tests at a
production tailnet.
:::

## DNS

Tailnet-wide DNS settings, which Headscale keeps in a config file with no API
in front of them.

```typescript
await control.dns.nameservers()
await control.dns.setNameservers(["1.1.1.1"])
await control.dns.preferences()
await control.dns.setPreferences({ magicDNS: true })
await control.dns.searchPaths()
await control.dns.setSearchPaths(["example.com"])
```

Each write applies to every device on the tailnet at once.

## Device authorization

Only meaningful on a tailnet with device approval turned on.

```typescript
await control.nodes.setAuthorized(id, true)
await control.nodes.routes(id)
```

## Full user records

The shared `users.fetch()` returns the common shape. Tailscale tracks more:

```typescript
for (const user of await control.users.detailed()) {
  console.log(user.loginName, user.role, user.status, user.deviceCount)
}
```

## Keys

`keys.create()` always issues a pre-authorized auth key, so machines joining
with it skip device approval. `userId` is ignored: the key belongs to whoever
owns the API token. `description` is stored, which Headscale cannot do.

Listing costs one request per key. Tailscale's list endpoint returns ids only,
so `keys.fetch()` follows up with a request per key to fill in capabilities.
Fine for the handful of keys a tailnet usually has; worth knowing before you
call it in a loop.

## Where it differs from Headscale

| | Tailscale | Headscale |
| --- | --- | --- |
| Rename a node | not possible | supported |
| Node owner | login name, no separate id | a user record with an id |
| Auth keys | owned by the token's owner | scoped to a user |
| Policy concurrency | `ETag` and `If-Match` | none |
| DNS | an API | a config file |
| User records | read only | full CRUD |
| API keys | admin console | `apiKeys` |

## Raw shapes

`raw` carries the device, user or key as the API returned it:
[TailscaleDevice](../../api/tailnet/tailscale/interfaces/tailscaledevice/),
[TailscaleUser](../../api/tailnet/tailscale/interfaces/tailscaleuser/),
[TailscaleKey](../../api/tailnet/tailscale/interfaces/tailscalekey/).
