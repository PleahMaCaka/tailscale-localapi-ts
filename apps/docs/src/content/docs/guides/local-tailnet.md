---
title: A throwaway tailnet
description: Boot headscale and tailscaled on loopback so destructive calls stay harmless.
---

Testing `nodes.delete()` against the tailnet you actually use is a bad
afternoon. The repo's Nix dev shell gives you a disposable one instead: a
headscale control server and a userspace `tailscaled`, both bound to
`127.0.0.1`, with an embedded DERP relay so nothing leaves the machine.

```bash
nix develop
tailnet up
```

```
tailnet up
  control  http://127.0.0.1:8080
  socket   ~/.local/state/tailscale.ts/tailscaled.sock
  state    Running
  api key  ~/.local/state/tailscale.ts/apikey
```

`tailnet up` also issues a Headscale API key. Pull everything into the current
shell with:

```bash
eval "$(tailnet env)"
```

That exports `TAILSCALE_LOCALAPI_SOCKET`, `HEADSCALE_URL` and
`HEADSCALE_API_KEY`, which is all any package or app in the repo needs:

```bash
bun run test
bun run debug
bun run dev
```

## Commands

| Command | What it does |
| --- | --- |
| `tailnet up` | Start both daemons, join the node, issue an API key |
| `tailnet env` | Print export lines for the current shell |
| `tailnet status` | Show both daemons and the node state |
| `tailnet down` | Stop both daemons, keep the state |
| `tailnet reset` | Stop both daemons and delete every key, node and database |

## Where the state lives

Everything goes in `$XDG_STATE_HOME/tailscale.ts`, never in the repo. That is
not tidiness: unix sockets cannot be created on a Windows drive mounted into
WSL, so a checkout under `/mnt/c` would have no working socket at all.

## The config is not the default

Two settings in `nix/headscale.yaml` matter:

```yaml
policy:
  mode: database      # otherwise the policy API is unavailable

derp:
  server:
    enabled: true     # embedded relay, so nothing calls out to the internet
  urls: []
```

## Running destructive tests

Once the tailnet above is up, nothing in it is worth protecting:

```bash
HEADSCALE_TEST_DANGER=1 bun test tests/destructive
TAILSCALE_TEST_WRITE=1 TAILSCALE_TEST_DANGER=1 bun test tests/destructive
```

`tailnet up` re-joins the node afterwards.
