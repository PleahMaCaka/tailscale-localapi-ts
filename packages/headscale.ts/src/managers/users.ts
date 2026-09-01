import type { Http, TailnetUser, UserOps } from "tailnet.ts"
import { toTailnetUser } from "../map"
import type { CreateHeadscaleUserOptions, HeadscaleUser } from "../types"

/** Headscale owns its user records, so unlike Tailscale it can write them. */
export class HeadscaleUserOps implements UserOps {
  constructor(private readonly http: Http) {}

  async fetch(): Promise<TailnetUser[]> {
    const { users } = await this.http.json<{ users: HeadscaleUser[] }>("/user")

    return users.map(toTailnetUser)
  }

  /** Resolves one user by id, or `null` when there is no such user. */
  async byId(id: string): Promise<TailnetUser | null> {
    const { users } = await this.http.json<{ users: HeadscaleUser[] }>(
      `/user?id=${encodeURIComponent(id)}`
    )

    return users[0] ? toTailnetUser(users[0]) : null
  }

  /** Resolves one user by name, or `null` when there is no such user. */
  async byName(name: string): Promise<TailnetUser | null> {
    const { users } = await this.http.json<{ users: HeadscaleUser[] }>(
      `/user?name=${encodeURIComponent(name)}`
    )

    return users[0] ? toTailnetUser(users[0]) : null
  }

  /**
   * Creates a user.
   *
   * @remarks
   * Risk: **write**. Adds an identity that can own nodes and appear in ACL
   * rules.
   */
  async create(options: CreateHeadscaleUserOptions): Promise<TailnetUser> {
    const { user } = await this.http.json<{ user: HeadscaleUser }>("/user", {
      method: "POST",
      body: options
    })

    return toTailnetUser(user)
  }

  /**
   * Renames a user.
   *
   * @remarks
   * Risk: **write**. ACL rules naming the old user stop matching, so update
   * the policy in the same change.
   */
  async rename(id: string, newName: string): Promise<TailnetUser> {
    const path = `/user/${encodeURIComponent(id)}/rename/${encodeURIComponent(newName)}`
    const { user } = await this.http.json<{ user: HeadscaleUser }>(path, {
      method: "POST"
    })

    return toTailnetUser(user)
  }

  /**
   * Deletes a user.
   *
   * The server refuses while the user still owns nodes, so move or delete
   * those first.
   *
   * @remarks
   * Risk: **danger**. Irreversible, and takes the user's pre-auth keys with
   * it.
   */
  async delete(id: string): Promise<void> {
    await this.http.json(`/user/${encodeURIComponent(id)}`, {
      method: "DELETE"
    })
  }
}
