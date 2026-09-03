import type { Http, PolicyDocument, PolicyOps } from "@tailnet/core"

/**
 * The tailnet policy file.
 *
 * Tailscale returns an `ETag` with the document and accepts it back as
 * `If-Match`, so a concurrent edit is rejected instead of silently
 * overwritten. That token travels as {@link PolicyDocument.version}.
 */
export class TailscalePolicyOps implements PolicyOps {
  constructor(
    private readonly http: Http,
    private readonly tailnet: string
  ) {}

  private get path(): string {
    return `/tailnet/${encodeURIComponent(this.tailnet)}/acl`
  }

  async fetch(): Promise<PolicyDocument> {
    const response = await this.http.request<string>(this.path, {
      accept: "application/hujson",
      asText: true
    })

    return {
      policy: response.data,
      updatedAt: null,
      version: response.headers.get("etag")
    }
  }

  async set(policy: string, version?: string): Promise<PolicyDocument> {
    const response = await this.http.request<string>(this.path, {
      method: "POST",
      body: policy,
      accept: "application/hujson",
      headers: {
        "Content-Type": "application/hujson",
        ...(version ? { "If-Match": version } : {})
      },
      asText: true
    })

    return {
      policy: response.data,
      updatedAt: null,
      version: response.headers.get("etag")
    }
  }
}
