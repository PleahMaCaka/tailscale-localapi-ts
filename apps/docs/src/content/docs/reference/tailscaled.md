---
title: tailscaled.ts
description: The daemon on this machine, which no control plane can tell you about.
sidebar:
  order: 4
---

A different thing from the control-plane packages: this talks over a unix
socket to the `tailscaled` running next to your code, and answers questions
only that daemon can answer.

```typescript
import { Tailscaled } from "tailscaled.ts"

const daemon = new Tailscaled()
```

| Option | Default | What it does |
| --- | --- | --- |
| `socketPath` | `$TAILSCALE_LOCALAPI_SOCKET`, else `/var/run/tailscale/tailscaled.sock` | Where the daemon listens |
| `timeout` | `30000` | Milliseconds before a request aborts |
| `useCli` | `true` on Windows and macOS | Shell out to `tailscale debug localapi` |

## Reading

```typescript
await daemon.status()          // with peers
await daemon.status(false)     // without, much faster
await daemon.whois("100.64.0.1")
await daemon.derpMap()
await daemon.ping("100.64.0.1")
await daemon.isRunning()
```

Keys arrive camelized, including the awkward ones: `TailscaleIPs` becomes
`tailscaleIps` and `PeerAPIURL` becomes `peerApiUrl`.

## Managers

```typescript
await daemon.prefs.fetch()
await daemon.prefs.edit({ routeAll: true })     // write
await daemon.prefs.check(prefs)

await daemon.profiles.fetch()
await daemon.profiles.current()
await daemon.profiles.switch(id)                // write
await daemon.profiles.delete(id)                // danger

await daemon.dns.query("example.com")
await daemon.dns.osConfig()

await daemon.metrics.daemon()                   // prometheus text
await daemon.metrics.user()
await daemon.metrics.goroutines()
```

`prefs.fetch()` returns the real `ipn.Prefs` field names, camelized:
`routeAll`, `runSsh`, `wantRunning`, `exitNodeId`, `shieldsUp`.

### Editing prefs builds the mask for you

`PATCH /prefs` expects an `ipn.MaskedPrefs`: each field paired with a `Set`
flag.

```json
{ "RouteAll": true, "RouteAllSet": true }
```

Without the flag the daemon accepts the request and quietly ignores the value,
which is why hand-rolled pref patches so often look like they worked and did
nothing. `prefs.edit()` derives the flags from the keys you pass.

## Session and shutdown

```typescript
await daemon.login()          // write
await daemon.start({})        // write
await daemon.reloadConfig()   // write

await daemon.logout()         // danger
await daemon.resetAuth()      // danger
await daemon.shutdown()       // danger
```

On a headless machine reached only over Tailscale, `logout` removes your way
back in.

## Errors

Everything throws a subclass of `TailscaledError`.

| Class | Raised when |
| --- | --- |
| `DaemonUnreachableError` | The socket refused the connection or does not exist. Carries `socketPath`. |
| `AccessDeniedError` | HTTP 403. |
| `PeerNotFoundError` | HTTP 404. Unknown address, profile or endpoint. |
| `PreconditionsFailedError` | HTTP 412. |
| `LocalApiError` | Any other non-2xx. Carries `status`. |

```typescript
if (await daemon.isRunning()) {
  await daemon.status()
}
```

## The camelizer earns its keep

The LocalAPI sends Go field names, and naive camel-casing mangles the plural
acronyms. These are all covered by unit tests:

| Wire | This client |
| --- | --- |
| `TailscaleIPs` | `tailscaleIps` |
| `AllowedIPs` | `allowedIps` |
| `MagicDNSSuffix` | `magicDnsSuffix` |
| `ExitNodeAllowLANAccess` | `exitNodeAllowLanAccess` |
| `IPv4` | `ipv4` |
| `PeerAPIURL` | `peerApiUrl` |
