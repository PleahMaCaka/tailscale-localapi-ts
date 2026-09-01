---
title: A throwaway tailnet
description: Boot headscale and tailscaled on loopback so breaking calls stay harmless.
---

Testing `nodes.delete()` against the tailnet you actually use is a bad
afternoon. The repo's Nix dev shell gives you a disposable one instead: a
headscale control server and a userspace `tailscaled`, both bound to
`127.0.0.1`, with an embedded DERP relay so nothing leaves the machine.

```bash
nix develop
tailnet up
bun run dev
```

```
tailnet up
  control  http://127.0.0.1:8080
  socket   ~/.local/state/tailscale.ts/tailscaled.sock
  state    Running
  api key  ~/.local/state/tailscale.ts/apikey
```

Both daemons keep running in the background after the command returns. The
first run creates a Headscale user named `dev`, joins the daemon as
`dev-node`, and issues an API key. Inside the dev shell `tailnet up` also
exports `TAILSCALE_LOCALAPI_SOCKET`, `HEADSCALE_URL` and
`HEADSCALE_API_KEY`, so tests and apps find the tailnet with no further setup.
From any other shell, `eval "$(tailnet env)"` does the same.

## Commands

| Command | What it does |
| --- | --- |
| `tailnet up` | Start both daemons, join the node, issue an API key. Safe to repeat. |
| `tailnet env` | Print export lines for a shell |
| `tailnet status` | Show both daemons and the node state |
| `tailnet down` | Stop both daemons, keep the state |
| `tailnet reset` | Stop both daemons and delete every key, node and database |

## Where the state lives

Everything goes in `$XDG_STATE_HOME/tailscale.ts`, never in the repo. That is
not tidiness: unix sockets cannot be created on a Windows drive mounted into
WSL, so a checkout under `/mnt/c` would have no working socket at all. Set
`TAILSCALE_TS_DEV_DIR` to move it.

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

## Running breaking tests

Once the tailnet above is up, nothing in it is worth protecting:

```bash
export HEADSCALE_TEST_BREAKING=1
export TAILSCALE_TEST_WRITE=1 TAILSCALE_TEST_BREAKING=1
bun run test:breaking
```

The daemon tests log the node out along the way. `tailnet up` re-joins it.
