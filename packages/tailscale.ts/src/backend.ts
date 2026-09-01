import type { Backend } from "tailnet.ts"
import { Http, trimTrailingSlash } from "tailnet.ts"
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

/** The Tailscale control plane, wired up for {@link Tailnet}. */
export class TailscaleBackend implements Backend {
  readonly name = "tailscale"

  readonly tailnet: string

  readonly http: Http

  readonly nodes: TailscaleDeviceOps

  readonly users: TailscaleUserOps

  readonly keys: TailscaleKeyOps

  readonly policy: TailscalePolicyOps

  /** Tailscale only: tailnet-wide DNS settings. */
  readonly dns: TailscaleDnsOps

  constructor(options: TailscaleOptions) {
    if (!options.tailnet) throw new Error("Tailscale needs a tailnet")

    this.tailnet = options.tailnet
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

/**
 * Builds a Tailscale backend.
 *
 * @example
 * ```typescript
 * const control = new Tailnet(
 *   tailscale({ tailnet: "-", apiKey: process.env.TAILSCALE_API_KEY! })
 * )
 * ```
 */
export function tailscale(options: TailscaleOptions): TailscaleBackend {
  return new TailscaleBackend(options)
}
