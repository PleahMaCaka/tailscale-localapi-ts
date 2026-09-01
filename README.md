# tailnet.ts

One TypeScript client for Tailscale and Headscale control planes, a separate
client for the local daemon, and a Headplane-style dashboard built on both.

```typescript
import { Tailnet } from "tailnet.ts"
import { headscale } from "headscale.ts"

const control = new Tailnet(headscale({ url, apiKey }))

await control.nodes.fetch()
await control.nodes.setTags(id, ["tag:server"])
await control.policy.set(document)
```

Swapping to Tailscale's hosted control plane changes the constructor and
nothing else:

```typescript
import { tailscale } from "tailscale.ts"

const control = new Tailnet(tailscale({ tailnet: "-", apiKey }))
```

## Packages

| Path | What it is |
| --- | --- |
| `packages/tailnet.ts` | The shared contract, types and HTTP layer |
| `packages/headscale.ts` | Headscale backend, plus what only it can do |
| `packages/tailscale.ts` | Tailscale backend, plus its DNS API |
| `packages/tailscaled.ts` | The LocalAPI client for the daemon on this machine |
| `apps/panescale` | Dashboard covering machines, users, ACL, DNS and keys |
| `apps/docs` | Documentation site |
| `nix/` | Throwaway headscale + tailscaled for local testing |

## Risk levels

There are no `write` or `danger` namespaces. Each method's TSDoc says what it
can break, on a line that always reads the same, so your editor shows it on
hover and `rg 'Risk: \*\*danger\*\*'` finds every one.

```typescript
/**
 * Expires the node's key.
 *
 * @remarks
 * Risk: **danger**. The machine drops off the tailnet and cannot rejoin
 * until someone logs in on it again.
 */
```

No risk line means the method reads and changes nothing.

## Develop

```bash
nix develop            # bun, headscale, tailscale, and the tailnet helper
tailnet up             # isolated headscale + tailscaled on loopback
eval "$(tailnet env)"  # socket, control url and an API key
bun run test           # every package
bun run dev            # PaneScale on http://127.0.0.1:4270
bun run docs           # docs on http://127.0.0.1:4271
bun run check          # biome
```

`tailnet up` never touches a tailnet you actually use, which is what makes the
destructive tests safe to run:

```bash
bun run test:danger
```

The Tailscale backend is the exception: it is covered by unit tests against a
stubbed transport, never against a live tailnet.

## Documentation

`bun run docs`, or read `apps/docs/src/content/docs`.

## License

[MIT](./LICENSE)
