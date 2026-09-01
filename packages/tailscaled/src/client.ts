import { DnsManager } from "./managers/dns"
import { MetricsManager } from "./managers/metrics"
import { PrefsManager } from "./managers/prefs"
import { ProfileManager } from "./managers/profiles"
import { jsonInit, Transport } from "./transport"
import type {
  ClientOptions,
  DERPMap,
  PingResult,
  PingType,
  ReloadConfigResult,
  StartOptions,
  Status,
  Whois
} from "./types"

/**
 * A connection to the tailscaled daemon running on this machine.
 *
 * Methods without a risk note only read. Anything that changes or destroys
 * state names the risk in its `@remarks`.
 *
 * @example
 * ```typescript
 * const client = new Tailscaled()
 *
 * const status = await client.status()
 * await client.prefs.edit({ routeAll: true })
 * ```
 */
export class Tailscaled {
  /** Reads and edits `ipn.Prefs`. */
  readonly prefs: PrefsManager

  /** Login profiles stored on this machine. */
  readonly profiles: ProfileManager

  /** Name resolution inside the tailnet. */
  readonly dns: DnsManager

  /** Prometheus metrics and stack dumps. */
  readonly metrics: MetricsManager

  readonly transport: Transport

  constructor(options: ClientOptions = {}) {
    this.transport = new Transport(options)
    this.prefs = new PrefsManager(this.transport)
    this.profiles = new ProfileManager(this.transport)
    this.dns = new DnsManager(this.transport)
    this.metrics = new MetricsManager(this.transport)
  }

  /**
   * Returns the daemon's view of the tailnet.
   *
   * @param peers - Set to `false` to skip the peer list, which is much faster
   * on a large tailnet.
   */
  status(peers = true): Promise<Status> {
    return this.transport.json<Status>(peers ? "status" : "status?peers=false")
  }

  /** Resolves which node and user own a tailnet address. */
  async whois(addr: string): Promise<Whois> {
    if (!addr) throw new Error("whois requires an address")

    return this.transport.json<Whois>(`whois?addr=${encodeURIComponent(addr)}`)
  }

  /** Returns the DERP relay map the daemon is currently using. */
  derpMap(): Promise<DERPMap> {
    return this.transport.json<DERPMap>("derpmap")
  }

  /** Probes a peer and reports how the packets got there. */
  ping(
    ip: string,
    type: PingType = "disco",
    size?: number
  ): Promise<PingResult> {
    const params = new URLSearchParams({ ip, type })
    if (size !== undefined) params.set("size", String(size))

    return this.transport.json<PingResult>(`ping?${params}`, jsonInit("POST"))
  }

  /** Warns if IP forwarding is off while this node advertises routes. */
  checkIpForwarding(): Promise<{ warning?: string }> {
    return this.transport.json<{ warning?: string }>("check-ip-forwarding")
  }

  /** Reports whether the daemon marks its own packets with SO_MARK. */
  checkSoMark(): Promise<{ useSoMark: boolean }> {
    return this.transport.json<{ useSoMark: boolean }>("check-so-mark-in-use")
  }

  /** Returns `true` when a daemon answers on the socket. */
  async isRunning(): Promise<boolean> {
    try {
      await this.status(false)

      return true
    } catch {
      return false
    }
  }

  /**
   * Starts an interactive login.
   *
   * Poll {@link Tailscaled.status} afterwards and open the `authUrl` it
   * reports.
   *
   * @remarks
   * Risk: **write**. Brings the backend up and may replace the current
   * session.
   */
  login(): Promise<void> {
    return this.transport.send("login-interactive", jsonInit("POST"))
  }

  /**
   * Brings the backend up, optionally with an auth key and a prefs patch.
   *
   * @remarks
   * Risk: **write**. Connects this machine to a tailnet.
   */
  start(options: StartOptions = {}): Promise<void> {
    return this.transport.send("start", jsonInit("POST", options))
  }

  /**
   * Reloads the daemon's config file.
   *
   * @remarks
   * Risk: **write**. Applies whatever is on disk right now.
   */
  reloadConfig(): Promise<ReloadConfigResult> {
    return this.transport.json<ReloadConfigResult>(
      "reload-config",
      jsonInit("POST")
    )
  }

  /**
   * Logs this machine out of its tailnet.
   *
   * @remarks
   * Risk: **breaking**. The node key is dropped and the backend lands in
   * `NeedsLogin`. On a headless machine reached only over Tailscale, this
   * removes your way back in.
   */
  logout(): Promise<void> {
    return this.transport.send("logout", jsonInit("POST"))
  }

  /**
   * Clears stored credentials entirely.
   *
   * @remarks
   * Risk: **breaking**. Harsher than {@link Tailscaled.logout}: re-authentication
   * starts from scratch rather than reusing a saved profile.
   */
  resetAuth(): Promise<void> {
    return this.transport.send("reset-auth", jsonInit("POST"))
  }

  /**
   * Stops the daemon.
   *
   * @remarks
   * Risk: **breaking**. Nothing in this library can start it again; whatever
   * supervises `tailscaled` has to.
   */
  shutdown(): Promise<void> {
    return this.transport.send("shutdown", jsonInit("POST"))
  }
}
