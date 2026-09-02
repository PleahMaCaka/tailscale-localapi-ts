# @tailnet/core

The contract behind `@tailnet/headscale` and `@tailnet/tailscale`: the
abstract `Tailnet` class, the `NodeOps`, `UserOps`, `KeyOps` and `PolicyOps`
interfaces, the shared node, user, key and policy types, and the error
classes.

You do not install this package yourself. Everything in it is re-exported
from both control plane packages:

```typescript
import { Headscale, type Tailnet, NotFoundError } from "@tailnet/headscale"

async function offline(control: Tailnet) {
  const nodes = await control.nodes.fetch()

  return nodes.filter(n => !n.online)
}
```

[Guide](https://pleahmacaka.github.io/tailnet/reference/tailnet/) ·
[API](https://pleahmacaka.github.io/tailnet/api/tailnet/core/)
