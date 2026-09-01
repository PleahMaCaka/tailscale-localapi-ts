export interface HeadscaleOptions {
  /** Base URL of the Headscale server, for example `http://127.0.0.1:8080`. */
  url: string

  /** An API key from `headscale apikeys create`. */
  apiKey: string

  timeout?: number
}

export interface HeadscaleUser {
  id: string
  name: string
  createdAt: string
  displayName: string
  email: string
  providerId: string
  provider: string
  profilePicUrl: string
}

export type RegisterMethod =
  | "REGISTER_METHOD_UNSPECIFIED"
  | "REGISTER_METHOD_AUTH_KEY"
  | "REGISTER_METHOD_CLI"
  | "REGISTER_METHOD_OIDC"

export interface HeadscalePreAuthKey {
  id: string
  key: string
  user: HeadscaleUser
  reusable: boolean
  ephemeral: boolean
  used: boolean
  expiration: string
  createdAt: string
  aclTags: string[]
}

export interface HeadscaleNode {
  id: string
  machineKey: string
  nodeKey: string
  discoKey: string
  ipAddresses: string[]
  name: string
  givenName: string
  user: HeadscaleUser
  lastSeen: string
  expiry: string
  preAuthKey?: HeadscalePreAuthKey
  createdAt: string
  registerMethod: RegisterMethod
  forcedTags: string[]
  validTags: string[]
  invalidTags: string[]
  online: boolean
  approvedRoutes: string[]
  availableRoutes: string[]
  subnetRoutes: string[]
}

export interface HeadscaleApiKey {
  id: string
  prefix: string
  expiration: string
  createdAt: string
  lastSeen: string | null
}

export interface CreateHeadscaleUserOptions {
  name: string
  displayName?: string
  email?: string
  pictureUrl?: string
}
