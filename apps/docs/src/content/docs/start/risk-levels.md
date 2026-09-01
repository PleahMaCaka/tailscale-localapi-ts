---
title: Risk levels
description: How each method tells you what it can break.
sidebar:
  order: 3
---

Every method that changes something carries one line in its TSDoc, always in
the same shape:

```typescript
/**
 * Expires the node's key.
 *
 * @remarks
 * Risk: **breaking**. The machine drops off the tailnet and cannot rejoin
 * until someone logs in on it again.
 */
expire(id: string): Promise<void>
```

Three levels, one question each:

| Level | Question | Examples |
| --- | --- | --- |
| *no risk line* | Does it change anything? No. | `nodes.fetch`, `status` |
| **write** | Can another call undo it? | `setTags`, `prefs.edit`, `setNameservers` |
| **breaking** | Does something go offline or away? | `nodes.expire`, `nodes.delete`, `logout`, `policy.set` |

No line means a read, so you never check a list to know `nodes.fetch()` is
safe. The line shows up in three places: on hover in your editor, in the
generated [API reference](../../api/), and in a grep of the source.

## Why not namespaces

An earlier version put writes under `client.write.*` and breaking calls under
`client.danger.*`. It made risky calls obvious in a diff, and it made every
call site ugly. The TSDoc carries the same information and the method names
stay flat:

```typescript
await control.nodes.fetch()
await control.nodes.setTags(id, ["tag:server"])
await control.nodes.delete(id)
```

## Finding the breaking calls in a codebase

The wording is fixed on purpose, so it greps:

```bash
rg 'Risk: \*\*breaking\*\*' node_modules/@tailnet/headscale/src
```

## The same convention in tests

`@tailnet/core` and `@tailnet/tailscale` have unit tests only. The two packages that
talk to a live server split their suites into the same three tiers, each gated
harder than the last:

| Tier | Runs when |
| --- | --- |
| `tests/unit` | Always. No server needed. |
| `tests/live` | A control plane or daemon is reachable. Daemon writes also need `TAILSCALE_TEST_WRITE=1`. |
| `tests/breaking` | `bun run test:breaking`, and the matching flag is set. |

```bash
bun run test                                            # unit and live

export HEADSCALE_TEST_BREAKING=1                        # @tailnet/headscale
export TAILSCALE_TEST_WRITE=1 TAILSCALE_TEST_BREAKING=1 # @tailnet/tailscaled
bun run test:breaking
```

The `TAILSCALE_TEST_*` flags gate `@tailnet/tailscaled`, the daemon client. The
Tailscale control plane is never tested against a live tailnet.

Point the live tiers at a [throwaway tailnet](../../guides/local-tailnet/)
before enabling the last one.
