# @tailnet/tailscaled

LocalAPI client for the tailscaled daemon running on this machine.

```bash
bun add @tailnet/tailscaled
```

```typescript
import { Tailscaled } from "@tailnet/tailscaled"

const daemon = new Tailscaled()

await daemon.status()
await daemon.prefs.edit({ routeAll: true })
await daemon.whois("100.64.0.1")
```

Speaks HTTP over the LocalAPI unix socket through Bun's `fetch({ unix })`,
so it needs Bun. On Windows and macOS it shells out to
`tailscale debug localapi` instead. Every method that changes something
carries a risk line in its TSDoc, `write` or `breaking`, shown on hover. No
line means it only reads.

[Guide](https://pleahmacaka.github.io/tailnet/reference/tailscaled/) ·
[API](https://pleahmacaka.github.io/tailnet/api/tailnet/tailscaled/)
