# @tailnet/headscale

Headscale control plane client.

```bash
bun add @tailnet/headscale
```

```typescript
import { Headscale } from "@tailnet/headscale"

const control = new Headscale({ url: "http://127.0.0.1:8080", apiKey })

await control.nodes.fetch()
await control.nodes.setTags(id, ["tag:server"])
await control.users.create({ name: "ci" })
await control.apiKeys.fetch()
```

`Headscale` extends `Tailnet`, the contract it shares with
`@tailnet/tailscale`, so code typed against `Tailnet` runs on either. Every
method that changes something carries a risk line in its TSDoc, `write` or
`breaking`, shown on hover. No line means it only reads.

[Guide](https://pleahmacaka.github.io/tailnet/reference/headscale/) ·
[API](https://pleahmacaka.github.io/tailnet/api/tailnet/headscale/)
