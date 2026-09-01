import type { Http, PolicyDocument, PolicyOps } from "@tailnet/core"

interface RawPolicy {
  policy: string
  updatedAt: string
}

/**
 * Requires `policy.mode: database` in the Headscale config. With the default
 * file mode the server owns the policy and these calls fail.
 */
export class HeadscalePolicyOps implements PolicyOps {
  constructor(private readonly http: Http) {}

  async fetch(): Promise<PolicyDocument> {
    const raw = await this.http.json<RawPolicy>("/policy")

    return { policy: raw.policy, updatedAt: raw.updatedAt, version: null }
  }

  async set(policy: string): Promise<PolicyDocument> {
    const raw = await this.http.json<RawPolicy>("/policy", {
      method: "PUT",
      body: { policy }
    })

    return { policy: raw.policy, updatedAt: raw.updatedAt, version: null }
  }
}
