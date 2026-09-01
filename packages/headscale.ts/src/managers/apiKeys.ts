import type { Http } from "tailnet.ts"
import type { HeadscaleApiKey } from "../types"

/**
 * Keys that grant access to the Headscale API itself.
 *
 * Headscale only. Tailscale manages API access tokens through its admin
 * console and OAuth clients instead.
 */
export class HeadscaleApiKeyOps {
  constructor(private readonly http: Http) {}

  /** Lists every key. Only the prefix is returned, never the secret. */
  async fetch(): Promise<HeadscaleApiKey[]> {
    const { apiKeys } = await this.http.json<{ apiKeys: HeadscaleApiKey[] }>(
      "/apikey"
    )

    return apiKeys
  }

  /**
   * Issues a new API key and returns it once.
   *
   * @remarks
   * Risk: **write**. The returned string is full administrative access to the
   * control server. Store it like a password.
   */
  async create(expiration?: string): Promise<string> {
    const { apiKey } = await this.http.json<{ apiKey: string }>("/apikey", {
      method: "POST",
      body: expiration ? { expiration } : {}
    })

    return apiKey
  }

  /**
   * Expires a key by its prefix.
   *
   * @remarks
   * Risk: **danger**. Anything authenticating with that key stops working at
   * once, including the caller if you expire your own.
   */
  async expire(prefix: string): Promise<void> {
    await this.http.json("/apikey/expire", { method: "POST", body: { prefix } })
  }

  /**
   * Deletes a key by its prefix.
   *
   * @remarks
   * Risk: **danger**. Irreversible, and immediate for anything using it.
   */
  async delete(prefix: string): Promise<void> {
    await this.http.json(`/apikey/${encodeURIComponent(prefix)}`, {
      method: "DELETE"
    })
  }
}
