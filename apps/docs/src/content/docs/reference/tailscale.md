---
title: tailscale.ts
description: The Tailscale backend, and the DNS API Headscale has no answer for.
sidebar:
  order: 3
---

```typescript
import { Tailnet } from "tailnet.ts"
import { tailscale } from "tailscale.ts"

const backend = tailscale({ tailnet: "-", apiKey: process.env.TAILSCALE_API_KEY! })
const control = new Tailnet(backend)
```

`tailnet` is your tailnet's name, such as `example.com`, or `-` for the default
tailnet of whoever owns the key.

:::caution
This backend is written against Tailscale's published OpenAPI schema and
covered by unit tests with a stubbed transport. Unlike the Headscale backend it
is not exercised against a live server in this repository, because doing so
would mean pointing tests at a production tailnet.
:::

## DNS

Tailnet-wide DNS settings, which Headscale keeps in a config file with no API
in front of them.

```typescript
await control.backend.dns.nameservers()
await control.backend.dns.setNameservers(["1.1.1.1"])        // write
await control.backend.dns.preferences()
await control.backend.dns.setPreferences({ magicDNS: true })  // write
await control.backend.dns.searchPaths()
await control.backend.dns.setSearchPaths(["example.com"])     // write
```

Each of these applies to every device on the tailnet at once.

## Device authorization

Only meaningful on a tailnet with device approval turned on.

```typescript
await control.backend.nodes.setAuthorized(id, true)    // write
await control.backend.nodes.routes(id)
```

## Full user records

The shared `users.fetch()` returns the common shape. Tailscale tracks more:

```typescript
for (const user of await control.backend.users.detailed()) {
  console.log(user.loginName, user.role, user.status, user.deviceCount)
}
```

## Where it differs from Headscale

| | Tailscale | Headscale |
| --- | --- | --- |
| Rename a node | not possible | supported |
| Node owner | login name, no separate id | a user record with an id |
| Auth keys | owned by the token's owner | scoped to a user |
| Policy concurrency | `ETag` and `If-Match` | none |
| DNS | an API | a config file |
| User records | read only | full CRUD |

## Listing keys costs one request per key

Tailscale's list endpoint returns ids only, so `keys.fetch()` follows up with a
request per key to fill in capabilities. Fine for the handful of keys a tailnet
usually has; worth knowing before you call it in a loop.
