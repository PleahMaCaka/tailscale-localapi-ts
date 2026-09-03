---
title: "@tailnet/tailcat"
description: Client for the tailcat CLI, which opens tunnels between two machines with no control plane.
sidebar:
  order: 5
---

[Tailcat](https://github.com/tailscale/tailcat) is a Tailscale tool that
opens a WireGuard tunnel between two machines through a DERP relay. One side
serves and receives a connection address, the other side connects with it.
It needs no account, no control plane and no root. This package runs the
`tailcat` binary, which must be on `PATH` or given in `binary`. Full
signatures: [Tailcat](../../api/tailnet/tailcat/classes/tailcat/).

```typescript
import { Tailcat } from "@tailnet/tailcat"

const tailcat = new Tailcat()
```

| Option | Default | What it does |
| --- | --- | --- |
| `binary` | `tailcat` | Path to the CLI |
| `key` | the CLI's own default | `new` for ephemeral, a saved key name, or a path |
| `derpMapUrl` | Tailscale's public tailcat relays | Which DERP map to pick a region from |
| `timeout` | `30000` | Milliseconds before a one-shot command is killed |

## Serve and connect

```typescript
const server = await tailcat.serve([8080])
console.log(server.address)   // tc..., give this to the client

const tunnel = tailcat.connect(address, 8080)
const writer = tunnel.writable.getWriter()
await writer.write(new TextEncoder().encode("GET / HTTP/1.0\r\n\r\n"))
console.log(await new Response(tunnel.readable).text())

tunnel.close()
server.stop()
```

`serve` resolves after the new server answers a ping. The CLI prints the
address before the server has joined the relay, and a client that connects
immediately loses its first packets. The wait is bounded by `timeout`.

Services are port numbers, ranges like `8000-8010`, or the named services
`all`, `exit-node`, `no-auth-ssh` and `files`. The `allow` option restricts
clients to the listed public keys. `fullAddress` embeds the relay info in
the address so clients skip the DERP map fetch. `files` serves a directory
over SFTP.

## Inspecting an address

```typescript
await tailcat.parse(address)      // public key and relay info, no network
await tailcat.resolve(address)    // the self-contained form of a short token
await tailcat.ping(address)       // one pong per line, relayed or direct
await tailcat.ping(address, { untilDirect: true, timeout: 30_000 })
```

Each pong reports `via: "derp"` with the relay code or `via: "direct"` with
the endpoint, and `latencyMs`. With `untilDirect`, the call rejects if no
direct path is established before the timeout.

## Saved keys

With an ephemeral key, each server run gets a new address that expires when
the process exits. A saved key keeps the same address across runs. Anyone
who has the address can reach any future server started with that key.

```typescript
await tailcat.genkey("default", { fixedRegion: true })   // server key, prints the address
await tailcat.genkey("client-default", { client: true }) // client identity, prints the public key
```

The CLI loads keys named `default` and `client-default` automatically, so
after creating them `new Tailcat()` uses them without configuration.

## Errors

| Class | Raised when |
| --- | --- |
| `TailcatMissingError` | The binary is not on `PATH`. Carries `binary`. |
| `TailcatExitError` | The CLI exited non-zero. Carries `exitCode` and `stderr`. |
| `TailcatError` | Invalid arguments rejected before the CLI is spawned. |

## Stability

Tailcat does not promise stable CLI flags or output, and this package
depends on both. Pin the `tailcat` version you tested against. The public
relays are rate limited. For higher throughput, run your own DERP server and
pass its hostname as `region` when generating a key.
