# @tailnet/tailcat

Client for the [tailcat](https://github.com/tailscale/tailcat) CLI: WireGuard
tunnels between two machines with no control plane.

```bash
bun add @tailnet/tailcat
```

```typescript
import { Tailcat } from "@tailnet/tailcat"

const tailcat = new Tailcat()

const server = await tailcat.serve([8080])
console.log(server.address)              // hand this to the other side

const tunnel = tailcat.connect(server.address, 8080)
await tailcat.ping(server.address)
```

Needs the `tailcat` binary on `PATH` and the Bun runtime. Tailcat promises no
CLI stability, so pin the version you tested against.

[Guide](https://pleahmacaka.github.io/tailnet/reference/tailcat/) ·
[API](https://pleahmacaka.github.io/tailnet/api/tailnet/tailcat/)
