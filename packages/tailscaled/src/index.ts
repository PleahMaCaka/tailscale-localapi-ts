export { Tailscaled, Tailscaled as default } from "./client"
export {
  AccessDeniedError,
  DaemonUnreachableError,
  LocalApiError,
  PeerNotFoundError,
  PreconditionsFailedError,
  TailscaledError
} from "./errors"
export { DnsManager } from "./managers/dns"
export { MetricsManager } from "./managers/metrics"
export { PrefsManager } from "./managers/prefs"
export { ProfileManager } from "./managers/profiles"
export { Transport } from "./transport"
export type * from "./types"
