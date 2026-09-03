---
title: PaneScale
description: Admin interface for Headscale or Tailscale, built on the tailnet packages.
---

PaneScale is the admin app in `apps/panescale`. It covers the same features
as Headplane. It is written against `Tailnet`, so the same screens work with
a Headscale server or a Tailscale tailnet.

```bash
nix develop
tailnet up
bun run dev
```

It serves on `http://127.0.0.1:4270`.

## Screens

| Page | Contents |
| --- | --- |
| Machines | All nodes, with search, filter, a per-row action menu and a details dialog |
| Users | Users and their nodes. Create, rename and delete on Headscale |
| Access control | The policy document, validated by the server before it is stored |
| DNS | Tailnet name, MagicDNS, nameservers, search domains |
| Keys | Auth keys per user, and Headscale API keys |
| This node | Local daemon status, prefs, exit node, logout and shutdown |

**This node** uses `@tailnet/tailscaled` over the unix socket instead of
the control plane. It is the only page that works without an API key.

## Configuration

```bash
HEADSCALE_URL=http://127.0.0.1:8080                 # default
HEADSCALE_API_KEY=...
HEADSCALE_CONFIG_PATH=/etc/headscale/config.yaml   # for the DNS page
```

or

```bash
TAILSCALE_TAILNET=example.com                       # default: -
TAILSCALE_API_KEY=...
```

The control plane is chosen by which key is set. If both are set, Headscale
is used. The daemon socket path comes from `TAILSCALE_LOCALAPI_SOCKET`.

## Differences per control plane

Controls the current control plane does not support are hidden:

- **Rename** is hidden on Tailscale, where a device's name comes from the
  machine.
- **Move owner** and the user create, rename and delete controls appear only
  for Headscale.
- **DNS** uses Tailscale's API or Headscale's config file. The config-file
  mode is labelled, warns when the file is not writable, and notes that
  Headscale reads the file only at startup.
- **API keys** appear only for Headscale.

## Interface conventions

Lists have no inline editing. Each row has a menu and each action opens a
dialog. A newly created key is shown in a dialog with a copy button, since
the secret is returned only once.

Rows start with the node's tailnet address, which is stable where names are
not. Numbers use tabular figures so columns align. Tag colours are derived
from the tag string, so a tag has the same colour on every screen.

Icons are bundled at build time instead of fetched from the Iconify API, so
the app works on an isolated network. Run `bun run icons` after adding an
icon.

## Risk styling

The three [risk levels](../../start/risk-levels/) map to panel styles.
Read-only panels are plain. Panels with write actions have a warning outline.
Breaking actions are in a panel with an error outline, and each button opens
a confirmation dialog.

## Deployment

The app is built with `adapter-node` and must run on Bun, because the daemon
socket is reached through Bun's `fetch({ unix })`.

```bash
bun run build
bun run start
```

Bind it to loopback. The app has no authentication, and any client that can
reach it can use the control plane API key.
