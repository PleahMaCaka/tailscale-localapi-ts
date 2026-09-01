import type { AuthKey, TailnetNode, TailnetUser } from "tailnet.ts"
import type { HeadscaleNode, HeadscalePreAuthKey, HeadscaleUser } from "./types"

/** Go's zero time, which Headscale sends for "this never happened". */
function orNull(timestamp: string): string | null {
  return !timestamp || timestamp.startsWith("0001-01-01") ? null : timestamp
}

export function toTailnetNode(node: HeadscaleNode): TailnetNode {
  return {
    id: node.id,
    name: node.givenName || node.name,
    // Headscale does not report a fully qualified name; it lives in its config
    fqdn: "",
    owner: { id: node.user.id, name: node.user.name },
    addresses: node.ipAddresses,
    tags: node.forcedTags.length ? node.forcedTags : node.validTags,
    online: node.online,
    lastSeen: orNull(node.lastSeen),
    expires: orNull(node.expiry),
    advertisedRoutes: node.availableRoutes,
    enabledRoutes: node.approvedRoutes,
    os: "",
    clientVersion: "",
    raw: node
  }
}

export function toTailnetUser(user: HeadscaleUser): TailnetUser {
  return {
    id: user.id,
    name: user.name,
    displayName: user.displayName,
    profilePicUrl: user.profilePicUrl,
    createdAt: user.createdAt,
    raw: user
  }
}

export function toAuthKey(key: HeadscalePreAuthKey): AuthKey {
  return {
    id: key.id,
    secret: key.key,
    reusable: key.reusable,
    ephemeral: key.ephemeral,
    tags: key.aclTags,
    createdAt: key.createdAt,
    expires: orNull(key.expiration),
    used: key.used,
    raw: key
  }
}
