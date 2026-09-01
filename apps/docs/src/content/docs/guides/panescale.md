---
title: PaneScale
description: A Headplane-style admin interface that works against either control plane.
---

PaneScale is the app in `apps/panescale`. It covers the same ground as
Headplane, with one difference: it is built on the shared contract, so the same
screens drive a Headscale server or a Tailscale tailnet.

```bash
nix develop
tailnet up
bun run dev
```

It serves on `http://127.0.0.1:4270`.

## Screens

| Page | Contents |
| --- | --- |
| Machines | Every node, led by its address. Search, filter, a row menu for each action, and a details dialog |
| Users | Who owns what, with create, rename and delete where the backend allows it |
| Access control | The policy document, validated by the server before it is stored |
| DNS | Tailnet name, MagicDNS, nameservers, search domains |
| Keys | Auth keys per user, and Headscale API keys |
| This node | The local daemon: status, prefs, exit node, danger zone |

The last one is the odd one out on purpose. It talks to `tailscaled.ts` over
the unix socket, not to the control plane, and it is the only page that works
with no API key configured.

## Configuration

```bash
HEADSCALE_URL=http://127.0.0.1:8080
HEADSCALE_API_KEY=...
HEADSCALE_CONFIG_PATH=/etc/headscale/config.yaml   # for the DNS page
```

or

```bash
TAILSCALE_TAILNET=example.com
TAILSCALE_API_KEY=...
```

Whichever key is set decides the backend. The local daemon socket comes from
`TAILSCALE_LOCALAPI_SOCKET` as usual.

## What changes per backend

The interface hides what the backend cannot do rather than failing at the
click:

- **Rename** disappears on Tailscale, which takes a device's name from the
  machine itself.
- **Move owner** and the user create/rename/delete controls appear only for
  Headscale.
- **DNS** reads and writes Tailscale's API, or Headscale's config file. In the
  config-file case it says so, warns when the file is not writable, and
  reminds you that Headscale reads it only at startup.
- **API keys** appear only for Headscale.

## How it is put together

Nothing edits inline in a list. Every row carries a menu, every action opens a dialog, and a created key appears in a dialog with a copy button because the secret is shown once.

Rows lead with the machine's tailnet address rather than its name, since that is what stays stable and what people actually scan for. Figures are tabular so those columns line up without a monospace face. Tags take a colour derived from the tag string, so the same tag reads the same on every screen.

Icons are compiled in rather than fetched from the Iconify API, so the interface renders on an isolated network. Run `bun run icons` after adding one.

## Risk shows in the styling

The three levels from the [risk levels](/start/risk-levels/) page carry into
the interface. Read-only panels are plain, panels that change settings are
outlined in warning, and destructive actions sit in a panel outlined in error
with a confirmation dialog in front of every button.

## Deployment

Built with `adapter-node`, and it has to run on Bun because the local daemon
socket is reached through Bun's `fetch({ unix })`.

```bash
bun run build
bun run start
```

Bind it to loopback. It has no authentication of its own, and anything that can
reach it holds your control plane's API key.
