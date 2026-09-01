import type { Http, NodeOps, TailnetNode } from "tailnet.ts"
import { toTailnetNode } from "../map"
import type { HeadscaleNode } from "../types"

/** Headscale's node endpoints, plus the two it has that Tailscale does not. */
export class HeadscaleNodeOps implements NodeOps {
  constructor(private readonly http: Http) {}

  async fetch(): Promise<TailnetNode[]>
  async fetch(id: string): Promise<TailnetNode>
  async fetch(id?: string): Promise<TailnetNode[] | TailnetNode> {
    if (id === undefined) {
      const { nodes } = await this.http.json<{ nodes: HeadscaleNode[] }>(
        "/node"
      )

      return nodes.map(toTailnetNode)
    }

    const { node } = await this.http.json<{ node: HeadscaleNode }>(
      `/node/${encodeURIComponent(id)}`
    )

    return toTailnetNode(node)
  }

  /**
   * Lists the nodes owned by one user.
   *
   * @param userName - The user's `name`, not its id. This endpoint is the one
   * place in the Headscale API that filters by name, and passing an id fails
   * with "user not found".
   */
  async byUser(userName: string): Promise<TailnetNode[]> {
    const { nodes } = await this.http.json<{ nodes: HeadscaleNode[] }>(
      `/node?user=${encodeURIComponent(userName)}`
    )

    return nodes.map(toTailnetNode)
  }

  async setTags(id: string, tags: string[]): Promise<void> {
    await this.http.json(`/node/${encodeURIComponent(id)}/tags`, {
      method: "POST",
      body: { tags }
    })
  }

  async setRoutes(id: string, routes: string[]): Promise<void> {
    await this.http.json(`/node/${encodeURIComponent(id)}/approve_routes`, {
      method: "POST",
      body: { routes }
    })
  }

  async rename(id: string, newName: string): Promise<void> {
    const path = `/node/${encodeURIComponent(id)}/rename/${encodeURIComponent(newName)}`

    await this.http.json(path, { method: "POST" })
  }

  async expire(id: string): Promise<void> {
    await this.http.json(`/node/${encodeURIComponent(id)}/expire`, {
      method: "POST"
    })
  }

  async delete(id: string): Promise<void> {
    await this.http.json(`/node/${encodeURIComponent(id)}`, {
      method: "DELETE"
    })
  }

  /**
   * Moves a node to a different owner.
   *
   * Headscale only. Tailscale ties device ownership to the registering user.
   *
   * @remarks
   * Risk: **write**. Ownership decides which ACL rules apply, so access can
   * change in both directions.
   */
  async moveToUser(id: string, userId: string): Promise<TailnetNode> {
    const { node } = await this.http.json<{ node: HeadscaleNode }>(
      `/node/${encodeURIComponent(id)}/user`,
      { method: "POST", body: { user: userId } }
    )

    return toTailnetNode(node)
  }

  /**
   * Registers a machine that is waiting with a node key.
   *
   * Headscale only.
   *
   * @remarks
   * Risk: **write**. Lets a new machine onto the tailnet.
   */
  async register(userId: string, nodeKey: string): Promise<TailnetNode> {
    const params = new URLSearchParams({ user: userId, key: nodeKey })
    const { node } = await this.http.json<{ node: HeadscaleNode }>(
      `/node/register?${params}`,
      { method: "POST" }
    )

    return toTailnetNode(node)
  }
}
