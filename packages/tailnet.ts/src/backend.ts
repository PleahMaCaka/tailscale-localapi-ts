import type {
  AuthKey,
  CreateAuthKeyOptions,
  PolicyDocument,
  TailnetNode,
  TailnetUser
} from "./types"

export interface NodeOps {
  /** Lists every node on the tailnet. */
  fetch(): Promise<TailnetNode[]>

  /** Resolves one node by id. */
  fetch(id: string): Promise<TailnetNode>

  /**
   * Replaces the node's tags. Pass the full set; an empty array clears them.
   *
   * @remarks
   * Risk: **write**. Tags drive ACL matching, so this grants or revokes
   * access across the tailnet.
   */
  setTags(id: string, tags: string[]): Promise<void>

  /**
   * Replaces the set of approved subnet routes.
   *
   * A route only carries traffic once the node advertises it *and* an
   * administrator enables it here.
   *
   * @remarks
   * Risk: **write**. Enabling a route sends every tailnet member's traffic
   * for that subnet through this node.
   */
  setRoutes(id: string, routes: string[]): Promise<void>

  /**
   * Expires the node's key.
   *
   * @remarks
   * Risk: **danger**. The machine drops off the tailnet and cannot rejoin
   * until someone logs in on it again.
   */
  expire(id: string): Promise<void>

  /**
   * Removes the node from the control plane.
   *
   * @remarks
   * Risk: **danger**. Irreversible. The machine loses its addresses and has
   * to register from scratch.
   */
  delete(id: string): Promise<void>

  /**
   * Renames a node.
   *
   * Optional because Tailscale has no rename endpoint: a device's name comes
   * from the machine itself. Check for the method before offering it.
   *
   * @remarks
   * Risk: **write**. The MagicDNS name changes, so anything addressing the
   * node by its old name stops resolving.
   */
  rename?(id: string, newName: string): Promise<void>
}

export interface UserOps {
  /** Lists every user on the tailnet. */
  fetch(): Promise<TailnetUser[]>
}

export interface KeyOps {
  /**
   * Lists auth keys.
   *
   * @param userId - Required by Headscale, which scopes keys per user.
   * Ignored by Tailscale.
   */
  fetch(userId?: string): Promise<AuthKey[]>

  /**
   * Issues an auth key. The secret is returned once and never again.
   *
   * @remarks
   * Risk: **write**. Anyone holding the secret can add a machine to the
   * tailnet with the tags baked in.
   */
  create(options: CreateAuthKeyOptions): Promise<AuthKey>

  /**
   * Revokes a key.
   *
   * Takes the whole key because the two backends identify keys differently:
   * Tailscale by id, Headscale by owner plus secret.
   *
   * @remarks
   * Risk: **write**. Machines already registered stay on the tailnet; only
   * new registrations are blocked.
   */
  revoke(key: AuthKey): Promise<void>
}

export interface PolicyOps {
  /** Returns the current access control policy. */
  fetch(): Promise<PolicyDocument>

  /**
   * Replaces the entire access control policy.
   *
   * @param version - Pass the `version` from a previous {@link PolicyOps.fetch}
   * to have the server reject the write if someone else changed the policy in
   * the meantime. Backends without a concurrency token ignore it.
   *
   * @remarks
   * Risk: **danger**. This is the whole tailnet's firewall in one call. Both
   * backends reject a malformed document, neither rejects a valid but wrong
   * one, and there is no automatic rollback.
   */
  set(policy: string, version?: string): Promise<PolicyDocument>
}

/** What every control plane has to provide for {@link Tailnet} to drive it. */
export interface Backend {
  readonly name: string

  readonly nodes: NodeOps

  readonly users: UserOps

  readonly keys: KeyOps

  readonly policy: PolicyOps

  /** Returns `true` when the server answers and the credentials are accepted. */
  isReachable(): Promise<boolean>
}
