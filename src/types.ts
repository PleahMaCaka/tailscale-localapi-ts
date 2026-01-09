export type BackendState =
  | "NoState"
  | "NeedsLogin"
  | "NeedsMachineAuth"
  | "Stopped"
  | "Starting"
  | "Running"

export interface PeerStatus {
  id: string
  publicKey: string
  hostName: string
  dnsName: string
  os: string
  userId: number
  tailscaleIps: string[]
  allowedIps?: string[]
  tags?: string[]
  addrs?: string[]
  curAddr: string
  relay: string
  peerRelay?: string
  rxBytes: number
  txBytes: number
  created: string
  lastWrite: string
  lastSeen: string
  lastHandshake: string
  online: boolean
  keepAlive?: boolean
  exitNode: boolean
  exitNodeOption: boolean
  active: boolean
  peerApiUrl?: string[]
  capabilities?: string[]
  sshHostKeys?: string[]
  noFileSharingReason?: string
  taildropTarget?: number
  shareeNode?: boolean
  inNetworkMap: boolean
  inMagicSock: boolean
  inEngine: boolean
  expired?: boolean
  keyExpiry?: string
}

export interface TailnetStatus {
  name: string
  magicDnsSuffix: string
  magicDnsEnabled: boolean
}

export interface Status {
  version: string
  tun?: boolean
  backendState: BackendState
  haveNodeKey?: boolean
  authUrl?: string
  tailscaleIps?: string[]
  self: PeerStatus
  health?: string[]
  magicDnsSuffix?: string
  currentTailnet?: TailnetStatus
  certDomains?: string[]
  peer?: Record<string, PeerStatus>
  user?: Record<string, UserProfile>
  clientVersion?: unknown
}

export interface Hostinfo {
  os?: string
  osVersion?: string
  hostname?: string
  services?: Service[]
  sshHostKeys?: string[]
}

export interface Service {
  proto: "tcp" | "udp" | "peerapi4" | "peerapi6" | "peerapi-dns-proxy"
  port: number
  description?: string
}

export interface Node {
  id: number
  stableId: string
  name: string
  user: number
  sharer?: number
  key: string
  keyExpiry: string
  machine: string
  discoKey: string
  addresses: string[]
  allowedIps: string[]
  endpoints?: string[]
  derp?: string
  hostinfo: Hostinfo
  created: string
  tags?: string[]
  primaryRoutes?: string[]
  lastSeen?: string
  online?: boolean
  keepAlive?: boolean
  machineAuthorized?: boolean
  capabilities?: string[]
  computedName: string
  computedNameWithHost: string
}

export interface UserProfile {
  id: number
  loginName: string
  displayName: string
  profilePicUrl?: string
}

export interface Whois {
  node: Node
  userProfile: UserProfile
  caps?: string[]
}

export interface Prefs {
  hostName: string
  acceptRoutes: boolean
  advertiseRoutes: string[]
  advertiseExitNode: boolean
  advertiseDefaultRoute: boolean
  exitNodeId?: string
  exitNodeAllowLanAccess: boolean
  ssh?: boolean
  funnel?: boolean
}

export type PartialPrefs = Partial<Prefs>

export interface DERPMap {
  regions: Record<string, DERPRegion>
  omitDefaultRegions: boolean
}

export interface DERPRegion {
  regionId: number
  regionCode: string
  regionName: string
  nodes: DERPNode[]
}

export interface DERPNode {
  name: string
  regionId: number
  hostName: string
  ipv4: string
  ipv6?: string
  stunOnly?: boolean
  canPort80?: boolean
}

export interface PingResult {
  bytes: number
  bytesSent: number
  roundTripMicros: number
  latencyMicros?: number
  err?: string
}

export interface DNSQueryResponse {
  bytes: number
  resolvers: Resolver[]
}

export interface Resolver {
  addr: string
}

export interface DNSOSConfig {
  nameservers: string[]
  searchDomains: string[]
  matchDomains: string[]
}

export interface LoginProfile {
  id: string
  name: string
  loginName: string
  tailnet: string
}

export interface ProfileStatus {
  current: LoginProfile
  profiles: LoginProfile[]
}

export interface ClientOptions {
  socketPath?: string
  timeout?: number
}

export class AccessDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AccessDeniedError"
  }
}

export class PeerNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PeerNotFoundError"
  }
}

export class PreconditionsFailedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PreconditionsFailedError"
  }
}

export type Device = PeerStatus & { isCurrent?: boolean }
