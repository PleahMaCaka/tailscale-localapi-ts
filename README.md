# tailnet

TypeScript clients for Tailscale, Headscale, the daemon on this machine, and
tailcat.

[Documentation](https://pleahmacaka.github.io/tailnet/start/getting-started/) ·
[API reference](https://pleahmacaka.github.io/tailnet/api/)

| Package | Version | What it is |
| --- | --- | --- |
| [`@tailnet/headscale`](https://www.npmjs.com/package/@tailnet/headscale) | [![npm](https://img.shields.io/npm/v/%40tailnet%2Fheadscale)](https://www.npmjs.com/package/@tailnet/headscale) | Headscale control plane client |
| [`@tailnet/tailscale`](https://www.npmjs.com/package/@tailnet/tailscale) | [![npm](https://img.shields.io/npm/v/%40tailnet%2Ftailscale)](https://www.npmjs.com/package/@tailnet/tailscale) | Tailscale control plane client |
| [`@tailnet/tailscaled`](https://www.npmjs.com/package/@tailnet/tailscaled) | [![npm](https://img.shields.io/npm/v/%40tailnet%2Ftailscaled)](https://www.npmjs.com/package/@tailnet/tailscaled) | LocalAPI client for the tailscaled daemon on this machine |
| [`@tailnet/tailcat`](https://www.npmjs.com/package/@tailnet/tailcat) | [![npm](https://img.shields.io/npm/v/%40tailnet%2Ftailcat)](https://www.npmjs.com/package/@tailnet/tailcat) | Client for the tailcat CLI, tunnels with no control plane |
| [`@tailnet/core`](https://www.npmjs.com/package/@tailnet/core) | [![npm](https://img.shields.io/npm/v/%40tailnet%2Fcore)](https://www.npmjs.com/package/@tailnet/core) | The shared contract behind the first two |

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

`apps/panescale` is an admin dashboard built on the same packages, for either
control plane.

## Develop

```bash
nix develop
tailnet up
bun run dev
```

## License

[MIT](./LICENSE)
