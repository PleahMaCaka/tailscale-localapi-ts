---
title: Risk levels
description: How each method tells you what it can break.
sidebar:
  order: 2
---

Every method that changes something says so in its TSDoc, on a line that always
looks the same:

```typescript
/**
 * Expires the node's key.
 *
 * @remarks
 * Risk: **danger**. The machine drops off the tailnet and cannot rejoin
 * until someone logs in on it again.
 */
expire(id: string): Promise<void>
```

Three levels, and one rule for reading them:

| Level | Meaning |
| --- | --- |
| *no risk line* | Reads. Changes nothing. |
| **write** | Changes state. Reversible by another call. |
| **danger** | Destroys state, or cuts something off the tailnet. |

The absence of a risk line is the signal for a read, so you never have to check
a list to know that `nodes.fetch()` is safe.

## Why not namespaces

An earlier version put writes under `client.write.*` and destructive calls
under `client.danger.*`. It made risky calls obvious in a diff, and it made
every call site ugly. The docs carry the same information, your editor shows
them on hover, and the method names stay flat:

```typescript
await control.nodes.fetch()
await control.nodes.setTags(id, ["tag:server"])
await control.nodes.delete(id)
```

## Finding the dangerous calls in a codebase

The wording is fixed on purpose, so it greps:

```bash
rg 'Risk: \*\*danger\*\*' node_modules/headscale.ts/src
```

## The same convention in tests

Each package splits its suite the same way, and each tier is gated harder than
the last:

```bash
bun test tests/unit          # no server needed
bun test tests/live          # needs a control plane or daemon
HEADSCALE_TEST_DANGER=1 bun test tests/destructive
```

Point them at a [throwaway tailnet](/guides/local-tailnet/) before enabling the
last one.
