export interface ClientOptions {
  socketPath?: string
  timeout?: number
  useCli?: boolean
}

export type BackendState =
  | "NoState"
  | "NeedsLogin"
  | "NeedsMachineAuth"
  | "Stopped"
  | "Starting"
  | "Running"

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
  certDomains?: string[] | null
  peer?: Record<string, PeerStatus>
  user?: Record<string, UserProfile>
  clientVersion?: ClientVersion | null
}

export interface ClientVersion {
  runningLatest?: boolean
  latestVersion?: string
  urgentSecurityUpdate?: boolean
  notify?: boolean
  notifyUrl?: string
  notifyText?: string
}

export interface TailnetStatus {
  name: string
  magicDnsSuffix: string
  magicDnsEnabled: boolean
}

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
  addrs?: string[] | null
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
  capMap?: Record<string, unknown[] | null>
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

export type Device = PeerStatus & { isSelf?: boolean }

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

export interface Node {
  id: number
  stableId: string
  name: string
  user: number
  sharer?: number
  key: string
  keyExpiry?: string
  machine: string
  discoKey: string
  addresses: string[]
  allowedIps: string[]
  endpoints?: string[]
  homeDerp?: number
  hostinfo: Hostinfo
  created: string
  tags?: string[]
  primaryRoutes?: string[]
  lastSeen?: string
  online?: boolean
  machineAuthorized?: boolean
  capabilities?: string[]
  computedName: string
  computedNameWithHost: string
}

export interface Hostinfo {
  ipnVersion?: string
  os?: string
  osVersion?: string
  package?: string
  hostname?: string
  goArch?: string
  goVersion?: string
  services?: Service[]
  sshHostKeys?: string[]
  netInfo?: Record<string, unknown>
}

export interface Service {
  proto: "tcp" | "udp" | "peerapi4" | "peerapi6" | "peerapi-dns-proxy"
  port: number
  description?: string
}

export interface AutoUpdatePrefs {
  check: boolean
  apply: boolean | null
}

export interface AppConnectorPrefs {
  advertise: boolean
}

export interface Prefs {
  controlUrl: string
  routeAll: boolean
  exitNodeId: string
  exitNodeIp: string
  exitNodeAllowLanAccess: boolean
  corpDns: boolean
  runSsh: boolean
  runWebClient: boolean
  wantRunning: boolean
  loggedOut: boolean
  shieldsUp: boolean
  advertiseTags: string[] | null
  hostname: string
  notepadUrls: boolean
  advertiseRoutes: string[] | null
  advertiseServices: string[] | null
  noSnat: boolean
  noStatefulFiltering: boolean
  netfilterMode: number
  autoUpdate: AutoUpdatePrefs
  appConnector: AppConnectorPrefs
  postureChecking: boolean
  netfilterKind: string
  allowSingleHosts: boolean
  operatorUser?: string
  profileName?: string
}

export type PrefsPatch = Partial<Prefs>

export interface NetworkProfile {
  magicDnsName: string
  domainName: string
  displayName: string
}

export interface LoginProfile {
  id: string
  name: string
  key: string
  networkProfile: NetworkProfile
  userProfile: UserProfile
  nodeId: string
  localUserId: string
  controlUrl: string
}

export interface ProfileStatus {
  current: LoginProfile | null
  profiles: LoginProfile[]
}

export interface DERPMap {
  regions: Record<string, DERPRegion>
  omitDefaultRegions?: boolean
}

export interface DERPRegion {
  regionId: number
  regionCode: string
  regionName: string
  latitude?: number
  longitude?: number
  nodes: DERPNode[]
}

export interface DERPNode {
  name: string
  regionId: number
  hostName: string
  ipv4?: string
  ipv6?: string
  stunOnly?: boolean
  canPort80?: boolean
}

export type PingType = "disco" | "TSMP" | "ICMP" | "peerapi"

export interface PingResult {
  ip: string
  nodeIp?: string
  nodeName?: string
  err?: string
  latencySeconds?: number
  endpoint?: string
  derpRegionId?: number
  derpRegionCode?: string
  peerApiPort?: number
  isLocalIp?: boolean
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

export interface StartOptions {
  authKey?: string
  prefs?: PrefsPatch
  updatePrefs?: PrefsPatch
}

export interface ReloadConfigResult {
  reloaded: boolean
  error?: string
}
