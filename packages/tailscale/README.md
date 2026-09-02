# @tailnet/tailscale

Tailscale control plane client.

```bash
bun add @tailnet/tailscale
```

```typescript
import { Tailscale } from "@tailnet/tailscale"

const control = new Tailscale({ apiKey })

await control.nodes.fetch()
await control.policy.fetch()
await control.dns.nameservers()
```

The key's own tailnet is used unless you pass `tailnet: "example.com"`.
`Tailscale` extends `Tailnet`, the contract it shares with
`@tailnet/headscale`, so code typed against `Tailnet` runs on either. Every
method that changes something carries a risk line in its TSDoc, `write` or
`breaking`, shown on hover. No line means it only reads.

[Guide](https://pleahmacaka.github.io/tailnet/reference/tailscale/) ·
[API](https://pleahmacaka.github.io/tailnet/api/tailnet/tailscale/)
