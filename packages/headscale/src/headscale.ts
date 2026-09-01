import { Http, Tailnet, trimTrailingSlash } from "@tailnet/core"
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

/**
 * A Headscale server.
 *
 * @example
 * ```typescript
 * const control = new Headscale({ url: "http://127.0.0.1:8080", apiKey })
 *
 * await control.nodes.fetch()
 * await control.users.create({ name: "ci" })
 * ```
 */
export class Headscale extends Tailnet {
  readonly name = "headscale"

  /** @internal */
  readonly http: Http

  readonly nodes: HeadscaleNodeOps

  readonly users: HeadscaleUserOps

  readonly keys: HeadscaleKeyOps

  readonly policy: HeadscalePolicyOps

  /** Keys that grant access to the Headscale API itself. */
  readonly apiKeys: HeadscaleApiKeyOps

  constructor(options: HeadscaleOptions) {
    super()

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
