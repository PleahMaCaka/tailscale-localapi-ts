import type { AuthKey, TailnetNode, TailnetUser } from "@tailnet/core"
import type { TailscaleDevice, TailscaleKey, TailscaleUser } from "./types"

export function toTailnetNode(device: TailscaleDevice): TailnetNode {
  return {
    id: device.nodeId || device.id,
    name: device.hostname,
    fqdn: device.name,
    // Tailscale identifies the owner by login name only; there is no user id here
    owner: { id: device.user, name: device.user },
    addresses: device.addresses,
    tags: device.tags ?? [],
    online: device.connectedToControl,
    lastSeen: device.connectedToControl ? null : (device.lastSeen ?? null),
    expires: device.keyExpiryDisabled ? null : device.expires || null,
    advertisedRoutes: device.advertisedRoutes ?? [],
    enabledRoutes: device.enabledRoutes ?? [],
    os: device.os,
    clientVersion: device.clientVersion,
    raw: device
  }
}

export function toTailnetUser(user: TailscaleUser): TailnetUser {
  return {
    id: user.id,
    name: user.loginName,
    displayName: user.displayName,
    profilePicUrl: user.profilePicUrl,
    createdAt: user.created,
    raw: user
  }
}

export function toAuthKey(key: TailscaleKey): AuthKey {
  const create = key.capabilities?.devices?.create

  return {
    id: key.id,
    secret: key.key ?? null,
    reusable: create?.reusable ?? false,
    ephemeral: create?.ephemeral ?? false,
    tags: create?.tags ?? [],
    createdAt: key.created,
    expires: key.expires || null,
    // Tailscale does not report per-key usage, only whether it is still valid
    used: key.invalid ?? false,
    raw: key
  }
}
