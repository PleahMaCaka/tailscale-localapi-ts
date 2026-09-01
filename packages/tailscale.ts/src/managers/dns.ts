import type { Http } from "tailnet.ts"
import type { DnsPreferences } from "../types"

/**
 * Tailnet-wide DNS settings.
 *
 * Tailscale only. Headscale keeps the same settings in its config file, with
 * no API in front of them.
 */
export class TailscaleDnsOps {
  constructor(
    private readonly http: Http,
    private readonly tailnet: string
  ) {}

  private path(suffix: string): string {
    return `/tailnet/${encodeURIComponent(this.tailnet)}/dns/${suffix}`
  }

  /** The resolvers handed to every device on the tailnet. */
  async nameservers(): Promise<string[]> {
    const { dns } = await this.http.json<{ dns: string[] }>(
      this.path("nameservers")
    )

    return dns
  }

  /**
   * Replaces the tailnet's resolvers.
   *
   * @remarks
   * Risk: **write**. Every device on the tailnet starts resolving through
   * these, so a wrong entry breaks name resolution everywhere at once.
   */
  async setNameservers(nameservers: string[]): Promise<string[]> {
    const { dns } = await this.http.json<{ dns: string[] }>(
      this.path("nameservers"),
      { method: "POST", body: { dns: nameservers } }
    )

    return dns
  }

  /** Whether MagicDNS is on. */
  preferences(): Promise<DnsPreferences> {
    return this.http.json<DnsPreferences>(this.path("preferences"))
  }

  /**
   * Turns MagicDNS on or off.
   *
   * @remarks
   * Risk: **write**. Turning it off stops every machine name on the tailnet
   * from resolving.
   */
  setPreferences(preferences: DnsPreferences): Promise<DnsPreferences> {
    return this.http.json<DnsPreferences>(this.path("preferences"), {
      method: "POST",
      body: preferences
    })
  }

  /** Suffixes tried when a bare hostname is looked up. */
  async searchPaths(): Promise<string[]> {
    const { searchPaths } = await this.http.json<{ searchPaths: string[] }>(
      this.path("searchpaths")
    )

    return searchPaths
  }

  /**
   * Replaces the tailnet's search domains.
   *
   * @remarks
   * Risk: **write**. Applies to every device on the tailnet.
   */
  async setSearchPaths(searchPaths: string[]): Promise<string[]> {
    const response = await this.http.json<{ searchPaths: string[] }>(
      this.path("searchpaths"),
      { method: "POST", body: { searchPaths } }
    )

    return response.searchPaths
  }
}
