---
title: Local test tailnet
description: Run headscale and tailscaled on loopback for tests.
---

The Nix dev shell starts a disposable tailnet for tests: a headscale control
server and a userspace `tailscaled`, both bound to `127.0.0.1`, with an
embedded DERP relay so no traffic leaves the machine.

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
`dev-node`, and issues an API key. Inside the dev shell, `tailnet up` also
exports `TAILSCALE_LOCALAPI_SOCKET`, `HEADSCALE_URL` and
`HEADSCALE_API_KEY`, so tests and apps find the tailnet without further
setup. From any other shell, `eval "$(tailnet env)"` exports the same
variables.

## Commands

| Command | What it does |
| --- | --- |
| `tailnet up` | Start both daemons, join the node, issue an API key. Safe to repeat. |
| `tailnet env` | Print export lines for a shell |
| `tailnet status` | Show both daemons and the node state |
| `tailnet down` | Stop both daemons, keep the state |
| `tailnet reset` | Stop both daemons and delete every key, node and database |

## State directory

State lives in `$XDG_STATE_HOME/tailscale.ts`, not in the repo. Unix sockets
cannot be created on a Windows drive mounted into WSL, so a checkout under
`/mnt/c` could not hold the socket. Set `TAILSCALE_TS_DEV_DIR` to change the
directory.

## Headscale config

Two settings in `nix/headscale.yaml` differ from Headscale's defaults:

```yaml
policy:
  mode: database      # otherwise the policy API is unavailable

derp:
  server:
    enabled: true     # embedded relay, no external DERP
  urls: []
```

## Breaking tests

With this tailnet running, the breaking tiers can be enabled:

```bash
export HEADSCALE_TEST_BREAKING=1
export TAILSCALE_TEST_WRITE=1 TAILSCALE_TEST_BREAKING=1
bun run test:breaking
```

The daemon tests log the node out. Run `tailnet up` again to re-join it.
