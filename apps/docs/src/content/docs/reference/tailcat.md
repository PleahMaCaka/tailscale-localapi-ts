---
title: "@tailnet/tailcat"
description: Tunnels between two machines with no control plane, driven through the tailcat CLI.
sidebar:
  order: 5
---

[Tailcat](https://github.com/tailscale/tailcat) is netcat over Tailscale's
data plane: one side serves and gets a connection token, the other side
connects with it, and WireGuard plus DERP do the rest. No account, no
control plane, no root. This package drives the `tailcat` binary, which has
to be on `PATH` or named in `binary`. Full signatures on
[Tailcat](../../api/tailnet/tailcat/classes/tailcat/).

```typescript
import { Tailcat } from "@tailnet/tailcat"

const tailcat = new Tailcat()
```

| Option | Default | What it does |
| --- | --- | --- |
| `binary` | `tailcat` | Where the CLI lives |
| `key` | the CLI's own default | `new` for ephemeral, a saved key name, or a path |
| `derpMapUrl` | Tailscale's public tailcat relays | Which DERP map to pick a region from |
| `timeout` | `30000` | Milliseconds before a one-shot command is killed |

## Serve and connect

```typescript
const server = await tailcat.serve([8080])
console.log(server.address)   // tc..., hand this to the other side

const tunnel = tailcat.connect(address, 8080)
const writer = tunnel.writable.getWriter()
await writer.write(new TextEncoder().encode("GET / HTTP/1.0\r\n\r\n"))
console.log(await new Response(tunnel.readable).text())

tunnel.close()
server.stop()
```

`serve` resolves once the new server answers a ping, because the CLI prints
its address before it has joined the relay and a client acting on it at once
gets its first packets dropped. The wait is bounded by `timeout`. Services are ports, ranges like `8000-8010`,
or the named ones: `all`, `exit-node`, `no-auth-ssh`, `files`. `allow`
restricts clients to the listed public keys, `fullAddress` embeds the relay
info so clients skip the DERP map fetch, `files` serves a directory over SFTP.

## Look before you connect

```typescript
await tailcat.parse(address)      // public key and relay info, no network
await tailcat.resolve(address)    // the self-contained form of a short token
await tailcat.ping(address)       // one pong per line, relayed or direct
await tailcat.ping(address, { untilDirect: true, timeout: 30_000 })
```

Each pong reports `via: "derp"` with the relay code or `via: "direct"` with
the endpoint, plus `latencyMs`. With `untilDirect` the call rejects when no
direct path came up in time.

## Saved keys

An ephemeral key gives every server run a fresh address that dies with the
process. A saved key keeps the address stable, which also means anyone who
ever had it can reach the next server started with that key.

```typescript
await tailcat.genkey("default", { fixedRegion: true })   // server key, prints the address
await tailcat.genkey("client-default", { client: true }) // client identity, prints the public key
```

`default` and `client-default` are magic names the CLI picks up on its own,
so after creating them a plain `new Tailcat()` uses them.

## Errors

| Class | Raised when |
| --- | --- |
| `TailcatMissingError` | The binary is not on `PATH`. Carries `binary`. |
| `TailcatExitError` | The CLI exited non-zero. Carries `exitCode` and `stderr`. |
| `TailcatError` | Anything else this package rejects before spawning. |

## What to expect

Tailcat makes no stability promise for its CLI flags or output, and this
package reads both. Pin the `tailcat` version you tested against. The public
relays are rate limited; run your own DERP server and pass its hostname as
the `region` when generating a key if throughput matters.
