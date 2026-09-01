import type { Backend, KeyOps, NodeOps, PolicyOps, UserOps } from "./backend"

/**
 * One way to drive either control plane.
 *
 * The generic keeps the concrete backend visible on {@link Tailnet.backend},
 * so anything a single backend adds stays typed.
 *
 * @example
 * ```typescript
 * import { Tailnet } from "tailnet.ts"
 * import { headscale } from "headscale.ts"
 *
 * const control = new Tailnet(headscale({ url, apiKey }))
 *
 * await control.nodes.fetch()
 * await control.backend.apiKeys.fetch()
 * ```
 */
export class Tailnet<B extends Backend = Backend> {
  /** The backend itself, for the parts only it can do. */
  readonly backend: B

  readonly nodes: NodeOps

  readonly users: UserOps

  readonly keys: KeyOps

  readonly policy: PolicyOps

  constructor(backend: B) {
    this.backend = backend
    this.nodes = backend.nodes
    this.users = backend.users
    this.keys = backend.keys
    this.policy = backend.policy
  }

  /** Which control plane this is talking to. */
  get name(): string {
    return this.backend.name
  }

  /** Returns `true` when the server answers and the credentials are accepted. */
  isReachable(): Promise<boolean> {
    return this.backend.isReachable()
  }

  /** Whether this backend can rename a node at all. */
  get canRename(): boolean {
    return typeof this.nodes.rename === "function"
  }
}
