import type { AuthKey, CreateAuthKeyOptions, Http, KeyOps } from "@tailnet/core"
import { toAuthKey } from "../map"
import type { TailscaleKey } from "../types"

/** Tailscale auth keys, owned by whoever the API token belongs to. */
export class TailscaleKeyOps implements KeyOps {
  constructor(
    private readonly http: Http,
    private readonly tailnet: string
  ) {}

  /**
   * Lists auth keys.
   *
   * The list endpoint returns ids only, so each key is fetched to fill in its
   * capabilities. Fine for the handful of keys a tailnet usually has.
   */
  async fetch(): Promise<AuthKey[]> {
    const base = `/tailnet/${encodeURIComponent(this.tailnet)}/keys`
    const { keys } = await this.http.json<{ keys: { id: string }[] }>(base)

    const detailed = await Promise.all(
      keys.map(key =>
        this.http.json<TailscaleKey>(`${base}/${encodeURIComponent(key.id)}`)
      )
    )

    return detailed.map(toAuthKey)
  }

  async create(options: CreateAuthKeyOptions): Promise<AuthKey> {
    const created = await this.http.json<TailscaleKey>(
      `/tailnet/${encodeURIComponent(this.tailnet)}/keys`,
      {
        method: "POST",
        body: {
          keyType: "auth",
          description: options.description,
          expirySeconds: options.expirySeconds,
          capabilities: {
            devices: {
              create: {
                reusable: options.reusable ?? false,
                ephemeral: options.ephemeral ?? false,
                preauthorized: true,
                tags: options.tags ?? []
              }
            }
          }
        }
      }
    )

    return toAuthKey(created)
  }

  async revoke(key: AuthKey): Promise<void> {
    const path = `/tailnet/${encodeURIComponent(this.tailnet)}/keys/${encodeURIComponent(key.id)}`

    await this.http.json(path, { method: "DELETE" })
  }
}
