import { Http, Tailnet, trimTrailingSlash } from "@tailnet/core"
import { TailscaleDeviceOps } from "./managers/devices"
import { TailscaleDnsOps } from "./managers/dns"
import { TailscaleKeyOps } from "./managers/keys"
import { TailscalePolicyOps } from "./managers/policy"
import { TailscaleUserOps } from "./managers/users"
import type { TailscaleOptions } from "./types"

const DEFAULT_BASE_URL = "https://api.tailscale.com/api/v2"

function readErrorMessage(body: unknown, raw: string): string {
  const message = (body as { message?: string } | null)?.message

  return message ?? raw.trim()
}

/**
 * Tailscale's hosted control plane.
 *
 * @example
 * ```typescript
 * const control = new Tailscale({ apiKey })
 *
 * await control.nodes.fetch()
 * await control.dns.nameservers()
 * ```
 */
export class Tailscale extends Tailnet {
  readonly name = "tailscale"

  readonly tailnet: string

  /** @internal */
  readonly http: Http

  readonly nodes: TailscaleDeviceOps

  readonly users: TailscaleUserOps

  readonly keys: TailscaleKeyOps

  readonly policy: TailscalePolicyOps

  /** Tailnet-wide DNS settings. */
  readonly dns: TailscaleDnsOps

  constructor(options: TailscaleOptions) {
    super()

    this.tailnet = options.tailnet || "-"
    this.http = new Http({
      baseUrl: trimTrailingSlash(options.baseUrl ?? DEFAULT_BASE_URL),
      apiKey: options.apiKey,
      timeout: options.timeout,
      readErrorMessage
    })

    this.nodes = new TailscaleDeviceOps(this.http, this.tailnet)
    this.users = new TailscaleUserOps(this.http, this.tailnet)
    this.keys = new TailscaleKeyOps(this.http, this.tailnet)
    this.policy = new TailscalePolicyOps(this.http, this.tailnet)
    this.dns = new TailscaleDnsOps(this.http, this.tailnet)
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.nodes.fetch()

      return true
    } catch {
      return false
    }
  }
}
