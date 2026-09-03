---
title: "@tailnet/tailscale"
description: Tailscale control plane client and its Tailscale-only methods.
sidebar:
  order: 3
---

```typescript
import { Tailscale } from "@tailnet/tailscale"

const control = new Tailscale({ apiKey: process.env.TAILSCALE_API_KEY! })
```

Requests go to the tailnet that owns the API key unless
`tailnet: "example.com"` is passed. `baseUrl` replaces
`https://api.tailscale.com/api/v2` for a proxy or a mock server. Full
signatures: [Tailscale](../../api/tailnet/tailscale/classes/tailscale/).

:::caution
This package is written against Tailscale's published OpenAPI schema and
tested with a stubbed transport. It is not tested against a live Tailscale
server in this repository, since that would require a production tailnet.
:::

## DNS

Tailnet-wide DNS settings. Headscale has no API for these; it reads them
from its config file.

```typescript
await control.dns.nameservers()
await control.dns.setNameservers(["1.1.1.1"])
await control.dns.preferences()
await control.dns.setPreferences({ magicDNS: true })
await control.dns.searchPaths()
await control.dns.setSearchPaths(["example.com"])
```

Each write applies to every device on the tailnet.

## Device authorization

Applies only to tailnets with device approval enabled.

```typescript
await control.nodes.setAuthorized(id, true)
await control.nodes.routes(id)
```

## Detailed user records

The shared `users.fetch()` returns the common type. `users.detailed()`
returns Tailscale's full user record:

```typescript
for (const user of await control.users.detailed()) {
  console.log(user.loginName, user.role, user.status, user.deviceCount)
}
```

## Keys

`keys.create()` always creates a pre-authorized auth key, so machines that
join with it skip device approval. `userId` is ignored. The key belongs to
the owner of the API token. `description` is stored. Headscale does not
support key descriptions.

`keys.fetch()` makes one request per key. Tailscale's list endpoint returns
ids only, so the client fetches each key to fill in its capabilities. Avoid
calling it in a loop on tailnets with many keys.

## Differences from Headscale

| | Tailscale | Headscale |
| --- | --- | --- |
| Rename a node | not possible | supported |
| Node owner | login name, no separate id | a user record with an id |
| Auth keys | owned by the token's owner | scoped to a user |
| Policy concurrency | `ETag` and `If-Match` | none |
| DNS | an API | a config file |
| User records | read only | full CRUD |
| API keys | admin console | `apiKeys` |

## Raw types

`raw` holds the device, user or key as the API returned it:
[TailscaleDevice](../../api/tailnet/tailscale/interfaces/tailscaledevice/),
[TailscaleUser](../../api/tailnet/tailscale/interfaces/tailscaleuser/),
[TailscaleKey](../../api/tailnet/tailscale/interfaces/tailscalekey/).
