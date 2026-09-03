---
title: "@tailnet/tailscaled"
description: LocalAPI client for the tailscaled daemon on this machine.
sidebar:
  order: 4
---

This package talks to the `tailscaled` daemon on the same machine over its
LocalAPI unix socket. It is independent of the control-plane packages and
shares no types with them. Full signatures:
[Tailscaled](../../api/tailnet/tailscaled/classes/tailscaled/).

```typescript
import { Tailscaled } from "@tailnet/tailscaled"

const daemon = new Tailscaled()
```

| Option | Default | What it does |
| --- | --- | --- |
| `socketPath` | `$TAILSCALE_LOCALAPI_SOCKET`, else `/var/run/tailscale/tailscaled.sock` | Socket path |
| `timeout` | `30000` | Milliseconds before a request aborts |
| `useCli` | `true` on Windows and macOS | Run `tailscale debug localapi` instead of opening the socket |

## Transports

On Linux the client sends HTTP over the socket with Bun's `fetch({ unix })`,
so the package requires Bun. On Windows and macOS the socket cannot be
opened that way, so the same requests go through `tailscale debug localapi`.
The CLI must be on `PATH`, and its own socket configuration decides which
daemon it reaches.

## Reading

```typescript
await daemon.status()          // with peers
await daemon.status(false)     // without peers, faster
await daemon.whois("100.64.0.1")
await daemon.derpMap()
await daemon.ping("100.64.0.1")
await daemon.isRunning()
```

Response keys are converted to camelCase. Acronyms are treated as words:
`TailscaleIPs` becomes `tailscaleIps` and `PeerAPIURL` becomes `peerApiUrl`.

## Managers

```typescript
await daemon.prefs.fetch()
await daemon.prefs.edit({ routeAll: true })
await daemon.prefs.check(prefs)

await daemon.profiles.fetch()
await daemon.profiles.current()
await daemon.profiles.switch(id)
await daemon.profiles.delete(id)

await daemon.dns.query("example.com")
await daemon.dns.osConfig()

await daemon.metrics.daemon()
await daemon.metrics.user()
await daemon.metrics.goroutines()
```

`prefs.fetch()` returns the `ipn.Prefs` fields in camelCase: `routeAll`,
`runSsh`, `wantRunning`, `exitNodeId`, `shieldsUp`. The `metrics` methods
return Prometheus text, not JSON.

### Editing prefs

`PATCH /prefs` expects an `ipn.MaskedPrefs`, where each field is paired with
a `Set` flag:

```json
{ "RouteAll": true, "RouteAllSet": true }
```

Without the flag, the daemon accepts the request and ignores the value.
`prefs.edit()` sets the flags for the keys present in the patch.

## Session

```typescript
await daemon.login()
await daemon.start({ authKey })
await daemon.reloadConfig()
```

`login` returns before the login completes. Poll `status()` and open the
`authUrl` it reports.

## Logout and shutdown

```typescript
await daemon.logout()
await daemon.resetAuth()
await daemon.shutdown()
```

All three are breaking. On a machine reachable only over Tailscale, `logout`
cuts off remote access. `resetAuth` also deletes the saved profile, so the
next login starts from scratch. This library cannot restart a daemon after
`shutdown`.

## Errors

All errors are subclasses of
[TailscaledError](../../api/tailnet/tailscaled/classes/tailscalederror/).

| Class | Raised when |
| --- | --- |
| `DaemonUnreachableError` | The socket refused the connection or does not exist. Carries `socketPath`. |
| `AccessDeniedError` | HTTP 403. |
| `PeerNotFoundError` | HTTP 404. Unknown address, profile or endpoint. |
| `PreconditionsFailedError` | HTTP 412. |
| `LocalApiError` | Any other non-2xx. Carries `status`. |

The CLI transport has no HTTP status codes, so the error class is chosen
from the error text.

## Acronyms in field names

The LocalAPI uses Go field names. Naive camel-casing breaks on plural
acronyms, so the client handles these cases explicitly. Each is covered by a
unit test:

| Wire | This client |
| --- | --- |
| `TailscaleIPs` | `tailscaleIps` |
| `AllowedIPs` | `allowedIps` |
| `MagicDNSSuffix` | `magicDnsSuffix` |
| `ExitNodeAllowLANAccess` | `exitNodeAllowLanAccess` |
| `IPv4` | `ipv4` |
| `PeerAPIURL` | `peerApiUrl` |
