import type { Http, TailnetUser, UserOps } from "tailnet.ts"
import { toTailnetUser } from "../map"
import type { TailscaleUser } from "../types"

/**
 * Tailscale users are read only through the API: they arrive from whichever
 * identity provider the tailnet uses.
 */
export class TailscaleUserOps implements UserOps {
  constructor(
    private readonly http: Http,
    private readonly tailnet: string
  ) {}

  async fetch(): Promise<TailnetUser[]> {
    const { users } = await this.http.json<{ users: TailscaleUser[] }>(
      `/tailnet/${encodeURIComponent(this.tailnet)}/users`
    )

    return users.map(toTailnetUser)
  }

  /** The full Tailscale user records, including role, status and device count. */
  async detailed(): Promise<TailscaleUser[]> {
    const { users } = await this.http.json<{ users: TailscaleUser[] }>(
      `/tailnet/${encodeURIComponent(this.tailnet)}/users`
    )

    return users
  }
}
