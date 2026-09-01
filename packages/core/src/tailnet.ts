import type { KeyOps, NodeOps, PolicyOps, UserOps } from "./ops"

/**
 * What every control plane looks like from the outside.
 *
 * `Headscale` and `Tailscale` extend this, so code written against
 * `Tailnet` runs on either. Anything only one of them can do lives on the
 * subclass.
 *
 * @example
 * ```typescript
 * import { Headscale } from "@tailnet/headscale"
 *
 * const control = new Headscale({ url, apiKey })
 *
 * await control.nodes.fetch()
 * await control.apiKeys.fetch()
 * ```
 */
export abstract class Tailnet {
  /** Which control plane this is talking to. */
  abstract readonly name: string

  abstract readonly nodes: NodeOps

  abstract readonly users: UserOps

  abstract readonly keys: KeyOps

  abstract readonly policy: PolicyOps

  /** Returns `true` when the server answers and the credentials are accepted. */
  abstract isReachable(): Promise<boolean>

  /** Whether this control plane can rename a node at all. */
  get canRename(): boolean {
    return typeof this.nodes.rename === "function"
  }
}
