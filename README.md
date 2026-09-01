# tailnet

TypeScript clients for Tailscale, Headscale, the daemon on this machine, and
tailcat.

```typescript
import { Headscale } from "@tailnet/headscale"

const control = new Headscale({ url, apiKey })

await control.nodes.fetch()
await control.nodes.setTags(id, ["tag:server"])
```

```typescript
import { Tailscale } from "@tailnet/tailscale"

const control = new Tailscale({ apiKey })
```

```typescript
import { Tailscaled } from "@tailnet/tailscaled"

const daemon = new Tailscaled()

await daemon.status()
```

`Headscale` and `Tailscale` extend one `Tailnet` class, so code written
against it runs on either. Every method that changes something carries a
risk line in its TSDoc, `write` or `breaking`, shown on hover. No line means
it only reads.

| Package | What it is |
| --- | --- |
| `@tailnet/headscale` | Headscale control plane client |
| `@tailnet/tailscale` | Tailscale control plane client |
| `@tailnet/tailscaled` | LocalAPI client for the tailscaled daemon on this machine |
| `@tailnet/tailcat` | Client for the tailcat CLI, tunnels with no control plane |
| `@tailnet/core` | The shared contract behind the first two |
| `apps/panescale` | Admin dashboard for either control plane |

## Develop

```bash
nix develop
tailnet up
bun run dev
```

Docs: https://pleahmacaka.github.io/tailscale-localapi-ts

MIT
