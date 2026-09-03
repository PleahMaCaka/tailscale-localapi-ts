---
title: Risk levels
description: The TSDoc convention that marks which methods write or break something.
sidebar:
  order: 3
---

Every method that changes state has one line in its `@remarks`, in a fixed
format:

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

There are three levels:

| Level | Meaning | Examples |
| --- | --- | --- |
| *no risk line* | Read only. | `nodes.fetch`, `status` |
| **write** | Changes state. Another call can undo it. | `setTags`, `prefs.edit`, `setNameservers` |
| **breaking** | Takes something offline or deletes it. | `nodes.expire`, `nodes.delete`, `logout`, `policy.set` |

A method with no risk line is a read. The line appears on hover in the
editor, in the generated [API reference](../../api/), and in the source.

## Namespaces

An earlier version grouped writes under `client.write.*` and breaking calls
under `client.danger.*`. That made risky calls visible in a diff but added a
segment to every call site. The current version keeps method names flat and
carries the same information in TSDoc:

```typescript
await control.nodes.fetch()
await control.nodes.setTags(id, ["tag:server"])
await control.nodes.delete(id)
```

## Searching for breaking calls

The wording is fixed, so it can be searched:

```bash
rg 'Risk: \*\*breaking\*\*' node_modules/@tailnet/headscale/src
```

## Test tiers

`@tailnet/core` and `@tailnet/tailscale` have unit tests only.
`@tailnet/headscale` and `@tailnet/tailscaled` split their tests into three
tiers:

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

The `TAILSCALE_TEST_*` flags apply to `@tailnet/tailscaled`.
`@tailnet/tailscale` has no live tier.

Point the live tiers at a [local test tailnet](../../guides/local-tailnet/)
before enabling the breaking tier.
