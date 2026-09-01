---
title: "@tailnet/tailscaled"
description: LocalAPI client for the tailscaled daemon on this machine.
sidebar:
  order: 4
---

A different thing from the control-plane packages: this talks over a unix
socket to the `tailscaled` running next to your code, and answers questions
only that daemon can answer. Full signatures on
[Tailscaled](../../api/tailnet/tailscaled/classes/tailscaled/).

```typescript
import { Tailscaled } from "@tailnet/tailscaled"

const daemon = new Tailscaled()
```

| Option | Default | What it does |
| --- | --- | --- |
| `socketPath` | `$TAILSCALE_LOCALAPI_SOCKET`, else `/var/run/tailscale/tailscaled.sock` | Where the daemon listens |
| `timeout` | `30000` | Milliseconds before a request aborts |
| `useCli` | `true` on Windows and macOS | Shell out to `tailscale debug localapi` |

## Two transports

On Linux the client speaks HTTP over the socket with Bun's `fetch({ unix })`,
which is why the package needs Bun. On Windows and macOS the socket is not
reachable that way, so the same requests go through the `tailscale` CLI. The
CLI has to be on `PATH`, and its own socket setting decides which daemon it
reaches.

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

`prefs.fetch()` returns the real `ipn.Prefs` field names, camelized:
`routeAll`, `runSsh`, `wantRunning`, `exitNodeId`, `shieldsUp`. Everything
under `metrics` is Prometheus text, not JSON.

**Editing prefs builds the mask for you.** `PATCH /prefs` expects an
`ipn.MaskedPrefs`: each field paired with a `Set` flag.

```json
{ "RouteAll": true, "RouteAllSet": true }
```

Without the flag the daemon accepts the request and quietly ignores the value,
which is why hand-rolled pref patches so often look like they worked and did
nothing. `prefs.edit()` derives the flags from the keys you pass.

## Session

```typescript
await daemon.login()
await daemon.start({ authKey })
await daemon.reloadConfig()
```

`login` returns before anyone has logged in. Poll `status()` and open the
`authUrl` it reports.

## Taking the machine offline

```typescript
await daemon.logout()
await daemon.resetAuth()
await daemon.shutdown()
```

All three are breaking. On a headless machine reached only over Tailscale,
`logout` removes your way back in. `resetAuth` also drops the saved profile,
so the next login starts from scratch. Nothing in this library can restart a
daemon after `shutdown`.

## Errors

Everything throws a subclass of
[TailscaledError](../../api/tailnet/tailscaled/classes/tailscalederror/).

| Class | Raised when |
| --- | --- |
| `DaemonUnreachableError` | The socket refused the connection or does not exist. Carries `socketPath`. |
| `AccessDeniedError` | HTTP 403. |
| `PeerNotFoundError` | HTTP 404. Unknown address, profile or endpoint. |
| `PreconditionsFailedError` | HTTP 412. |
| `LocalApiError` | Any other non-2xx. Carries `status`. |

Over the CLI there are no status codes, so the same classes are chosen from
the error text instead.

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
