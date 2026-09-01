import type { AuthKey, CreateAuthKeyOptions, Http, KeyOps } from "tailnet.ts"
import { toAuthKey } from "../map"
import type { HeadscalePreAuthKey } from "../types"

function expiration(seconds: number | undefined): string {
  const fallback = 24 * 60 * 60

  return new Date(Date.now() + (seconds ?? fallback) * 1000).toISOString()
}

/** Headscale calls these pre-auth keys, and scopes every one to a user. */
export class HeadscaleKeyOps implements KeyOps {
  constructor(private readonly http: Http) {}

  async fetch(userId?: string): Promise<AuthKey[]> {
    if (!userId) {
      throw new Error(
        "Headscale scopes pre-auth keys per user, so pass a userId"
      )
    }

    const { preAuthKeys } = await this.http.json<{
      preAuthKeys: HeadscalePreAuthKey[]
    }>(`/preauthkey?user=${encodeURIComponent(userId)}`)

    return preAuthKeys.map(toAuthKey)
  }

  async create(options: CreateAuthKeyOptions): Promise<AuthKey> {
    if (!options.userId) {
      throw new Error("Headscale needs a userId to issue a pre-auth key")
    }

    const { preAuthKey } = await this.http.json<{
      preAuthKey: HeadscalePreAuthKey
    }>("/preauthkey", {
      method: "POST",
      body: {
        user: options.userId,
        reusable: options.reusable ?? false,
        ephemeral: options.ephemeral ?? false,
        expiration: expiration(options.expirySeconds),
        aclTags: options.tags ?? []
      }
    })

    return toAuthKey(preAuthKey)
  }

  async revoke(key: AuthKey): Promise<void> {
    const raw = key.raw as HeadscalePreAuthKey | undefined
    const userId = raw?.user?.id
    if (!userId || !key.secret) {
      throw new Error("Revoking a Headscale key needs its owner and secret")
    }

    await this.http.json("/preauthkey/expire", {
      method: "POST",
      body: { user: userId, key: key.secret }
    })
  }
}
