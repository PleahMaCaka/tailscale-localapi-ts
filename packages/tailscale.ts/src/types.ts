export interface TailscaleOptions {
  /**
   * The tailnet to operate on, for example `example.com`. Use `-` for the
   * default tailnet of whoever owns the API key.
   */
  tailnet: string

  /** An API access token or an OAuth-derived token. */
  apiKey: string

  /** Defaults to `https://api.tailscale.com/api/v2`. */
  baseUrl?: string

  timeout?: number
}

export interface TailscaleDevice {
  id: string
  nodeId: string
  name: string
  hostname: string
  user: string
  addresses: string[]
  tags?: string[]
  os: string
  clientVersion: string
  created: string
  lastSeen?: string
  connectedToControl: boolean
  expires: string
  keyExpiryDisabled: boolean
  authorized: boolean
  isExternal: boolean
  isEphemeral: boolean
  sshEnabled: boolean
  updateAvailable: boolean
  blocksIncomingConnections: boolean
  advertisedRoutes?: string[]
  enabledRoutes?: string[]
  nodeKey: string
  machineKey: string
}

export interface TailscaleUser {
  id: string
  displayName: string
  loginName: string
  profilePicUrl: string
  tailnetId: string
  created: string
  type: "member" | "shared"
  role: string
  status: string
  deviceCount: number
  lastSeen: string
  currentlyConnected: boolean
}

export interface TailscaleKeyCapabilities {
  devices?: {
    create?: {
      reusable?: boolean
      ephemeral?: boolean
      preauthorized?: boolean
      tags?: string[]
    }
  }
}

export interface TailscaleKey {
  id: string
  key?: string
  keyType?: "auth" | "client" | "api" | "federated"
  description?: string
  created: string
  expires: string
  revoked?: string
  invalid?: boolean
  capabilities?: TailscaleKeyCapabilities
}

export interface DeviceRoutes {
  advertisedRoutes: string[]
  enabledRoutes: string[]
}

export interface DnsPreferences {
  magicDNS: boolean
}
