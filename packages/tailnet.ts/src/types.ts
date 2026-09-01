/** A machine on the tailnet, as both control planes agree to describe it. */
export interface TailnetNode {
  id: string
  /** Short machine name shown in an admin interface. */
  name: string
  /** Fully qualified MagicDNS name, when the backend reports one. */
  fqdn: string
  owner: { id: string; name: string }
  addresses: string[]
  tags: string[]
  online: boolean
  /** `null` when the node has never been seen. */
  lastSeen: string | null
  /** `null` when the key never expires. */
  expires: string | null
  /** Routes the node offers. Set on the machine itself, never through an API. */
  advertisedRoutes: string[]
  /** Routes an administrator has approved. */
  enabledRoutes: string[]
  os: string
  clientVersion: string
  /** The backend's own representation, for anything this shape drops. */
  raw: unknown
}

export interface TailnetUser {
  id: string
  /** Login name on Tailscale, local user name on Headscale. */
  name: string
  displayName: string
  profilePicUrl: string
  createdAt: string
  raw: unknown
}

export interface AuthKey {
  id: string
  /**
   * The secret. Both control planes return it only when the key is created,
   * so this is `null` for keys that were merely listed.
   */
  secret: string | null
  reusable: boolean
  ephemeral: boolean
  tags: string[]
  createdAt: string
  expires: string | null
  used: boolean
  raw: unknown
}

export interface CreateAuthKeyOptions {
  /** Required by Headscale. Ignored by Tailscale, which uses the token's owner. */
  userId?: string
  reusable?: boolean
  ephemeral?: boolean
  tags?: string[]
  /** Seconds until the key expires. */
  expirySeconds?: number
  /** Free text. Only Tailscale stores it. */
  description?: string
}

export interface PolicyDocument {
  /** The HuJSON policy as text. */
  policy: string
  updatedAt: string | null
  /** Concurrency token, when the backend issues one. */
  version: string | null
}
