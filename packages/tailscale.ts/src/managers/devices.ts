import type { Http, NodeOps, TailnetNode } from "tailnet.ts"
import { toTailnetNode } from "../map"
import type { DeviceRoutes, TailscaleDevice } from "../types"

/**
 * Tailscale's device endpoints.
 *
 * There is no rename here on purpose: a device's name comes from the machine
 * itself, so {@link NodeOps.rename} is left unimplemented.
 */
export class TailscaleDeviceOps implements NodeOps {
  constructor(
    private readonly http: Http,
    private readonly tailnet: string
  ) {}

  async fetch(): Promise<TailnetNode[]>
  async fetch(id: string): Promise<TailnetNode>
  async fetch(id?: string): Promise<TailnetNode[] | TailnetNode> {
    if (id === undefined) {
      const { devices } = await this.http.json<{ devices: TailscaleDevice[] }>(
        `/tailnet/${encodeURIComponent(this.tailnet)}/devices`
      )

      return devices.map(toTailnetNode)
    }

    const device = await this.http.json<TailscaleDevice>(
      `/device/${encodeURIComponent(id)}`
    )

    return toTailnetNode(device)
  }

  async setTags(id: string, tags: string[]): Promise<void> {
    await this.http.json(`/device/${encodeURIComponent(id)}/tags`, {
      method: "POST",
      body: { tags }
    })
  }

  async setRoutes(id: string, routes: string[]): Promise<void> {
    await this.http.json(`/device/${encodeURIComponent(id)}/routes`, {
      method: "POST",
      body: { routes }
    })
  }

  async expire(id: string): Promise<void> {
    await this.http.json(`/device/${encodeURIComponent(id)}/expire`, {
      method: "POST"
    })
  }

  async delete(id: string): Promise<void> {
    await this.http.json(`/device/${encodeURIComponent(id)}`, {
      method: "DELETE"
    })
  }

  /** Returns which routes a device offers and which are enabled. */
  routes(id: string): Promise<DeviceRoutes> {
    return this.http.json<DeviceRoutes>(
      `/device/${encodeURIComponent(id)}/routes`
    )
  }

  /**
   * Authorizes a device, or withdraws its authorization.
   *
   * Tailscale only, and only meaningful on a tailnet with device approval
   * turned on.
   *
   * @remarks
   * Risk: **write**. Withdrawing authorization cuts the device off until an
   * administrator approves it again.
   */
  async setAuthorized(id: string, authorized: boolean): Promise<void> {
    await this.http.json(`/device/${encodeURIComponent(id)}/authorized`, {
      method: "POST",
      body: { authorized }
    })
  }
}
