import type { Backend } from "tailnet.ts"
import { Http, trimTrailingSlash } from "tailnet.ts"
import { HeadscaleApiKeyOps } from "./managers/apiKeys"
import { HeadscaleKeyOps } from "./managers/keys"
import { HeadscaleNodeOps } from "./managers/nodes"
import { HeadscalePolicyOps } from "./managers/policy"
import { HeadscaleUserOps } from "./managers/users"
import type { HeadscaleOptions } from "./types"

function readErrorMessage(body: unknown, raw: string): string {
  const message = (body as { message?: string } | null)?.message

  return message ?? raw.trim()
}

/** The Headscale control plane, wired up for {@link Tailnet}. */
export class HeadscaleBackend implements Backend {
  readonly name = "headscale"

  readonly http: Http

  readonly nodes: HeadscaleNodeOps

  readonly users: HeadscaleUserOps

  readonly keys: HeadscaleKeyOps

  readonly policy: HeadscalePolicyOps

  /** Headscale only: keys that grant access to the API itself. */
  readonly apiKeys: HeadscaleApiKeyOps

  constructor(options: HeadscaleOptions) {
    this.http = new Http({
      baseUrl: `${trimTrailingSlash(options.url)}/api/v1`,
      apiKey: options.apiKey,
      timeout: options.timeout,
      readErrorMessage
    })

    this.nodes = new HeadscaleNodeOps(this.http)
    this.users = new HeadscaleUserOps(this.http)
    this.keys = new HeadscaleKeyOps(this.http)
    this.policy = new HeadscalePolicyOps(this.http)
    this.apiKeys = new HeadscaleApiKeyOps(this.http)
  }

  async isReachable(): Promise<boolean> {
    try {
      await this.users.fetch()

      return true
    } catch {
      return false
    }
  }
}

/**
 * Builds a Headscale backend.
 *
 * @example
 * ```typescript
 * const control = new Tailnet(headscale({ url, apiKey }))
 * ```
 */
export function headscale(options: HeadscaleOptions): HeadscaleBackend {
  return new HeadscaleBackend(options)
}
