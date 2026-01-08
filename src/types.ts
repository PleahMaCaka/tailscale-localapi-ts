export type BackendState =
  | "NoState" // tailscale not running
  | "NeedsLogin"
  | "NeedsMachineAuth"
  | "Stopped"
  | "Starting"
  | "Running"

export interface PeerStatus {
  ID: string
  PublicKey: string
  HostName: string
  DNSName: string
  OS: string
  UserID: number
  TailscaleIPs: string[]
  AllowedIPs?: string[]
  Tags?: string[]
  Addrs?: string[]
  CurAddr: string
  Relay: string
  PeerRelay?: string
  RxBytes: number
  TxBytes: number
  Created: string
  LastWrite: string
  LastSeen: string
  LastHandshake: string
  Online: boolean
  KeepAlive?: boolean
  ExitNode: boolean
  ExitNodeOption: boolean
  Active: boolean
  PeerAPIURL?: string[]
  Capabilities?: string[]
  SSHHostKeys?: string[]
  NoFileSharingReason?: string
  TaildropTarget?: number
  ShareeNode?: boolean
  InNetworkMap: boolean
  InMagicSock: boolean
  InEngine: boolean
  Expired?: boolean
  KeyExpiry?: string
}

export interface TailnetStatus {
  Name: string
  MagicDNSSuffix: string
  MagicDNSEnabled: boolean
}

export interface Status {
  Version: string
  TUN?: boolean
  BackendState: BackendState
  HaveNodeKey?: boolean
  AuthURL?: string
  TailscaleIPs?: string[]
  Self: PeerStatus
  Health?: string[]
  MagicDNSSuffix?: string
  CurrentTailnet?: TailnetStatus
  CertDomains?: string[]
  Peer?: Record<string, PeerStatus>
  User?: Record<string, UserProfile>
  ClientVersion?: unknown
}

export interface Hostinfo {
  OS?: string
  OSVersion?: string
  Hostname?: string
  Services?: Service[]
  SSHHostKeys?: string[]
}

export interface Service {
  Proto: "tcp" | "udp" | "peerapi4" | "peerapi6" | "peerapi-dns-proxy"
  Port: number
  Description?: string
}

export interface Node {
  ID: number
  StableID: string
  Name: string
  User: number
  Sharer?: number
  Key: string
  KeyExpiry: string
  Machine: string
  DiscoKey: string
  Addresses: string[]
  AllowedIPs: string[]
  Endpoints?: string[]
  DERP?: string
  Hostinfo: Hostinfo
  Created: string
  Tags?: string[]
  PrimaryRoutes?: string[]
  LastSeen?: string
  Online?: boolean
  KeepAlive?: boolean
  MachineAuthorized?: boolean
  Capabilities?: string[]
  ComputedName: string
  ComputedNameWithHost: string
}

export interface UserProfile {
  ID: number
  LoginName: string
  DisplayName: string
  ProfilePicURL?: string
}

export interface Whois {
  Node: Node
  UserProfile: UserProfile
  Caps?: string[]
}

export interface Prefs {
  HostName: string
  AcceptRoutes: boolean
  AdvertiseRoutes: string[]
  AdvertiseExitNode: boolean
  AdvertiseDefaultRoute: boolean
  ExitNodeID?: string
  ExitNodeAllowLANAccess: boolean
  SSH?: boolean
  Funnel?: boolean
}

export type PartialPrefs = Partial<Prefs>

export interface DERPMap {
  Regions: Record<string, DERPRegion>
  OmitDefaultRegions: boolean
}

export interface DERPRegion {
  RegionID: number
  RegionCode: string
  RegionName: string
  Nodes: DERPNode[]
}

export interface DERPNode {
  Name: string
  RegionID: number
  HostName: string
  IPv4: string
  IPv6?: string
  STUNOnly?: boolean
  CanPort80?: boolean
}

export interface PingResult {
  Bytes: number
  BytesSent: number
  RoundTripMicros: number
  LatencyMicros?: number
  Err?: string
}

export interface DNSQueryResponse {
  Bytes: number
  Resolvers: Resolver[]
}

export interface Resolver {
  Addr: string
}

export interface DNSOSConfig {
  Nameservers: string[]
  SearchDomains: string[]
  MatchDomains: string[]
}

export interface LoginProfile {
  ID: string
  Name: string
  LoginName: string
  Tailnet: string
}

export interface ProfileStatus {
  Current: LoginProfile
  Profiles: LoginProfile[]
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

// utility types

export type Device = PeerStatus & { isCurrent?: boolean }
