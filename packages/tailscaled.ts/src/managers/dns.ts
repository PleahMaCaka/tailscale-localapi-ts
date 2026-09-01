import type { Transport } from "../transport"
import type { DNSOSConfig, DNSQueryResponse } from "../types"

/** Reads how this machine resolves names inside the tailnet. */
export class DnsManager {
  constructor(private readonly transport: Transport) {}

  /** Resolves a name through the daemon's resolver. */
  query(name: string, type = "A"): Promise<DNSQueryResponse> {
    return this.transport.json<DNSQueryResponse>(
      `dns-query?${new URLSearchParams({ name, type })}`
    )
  }

  /** Returns the DNS configuration the daemon pushed to the operating system. */
  osConfig(): Promise<DNSOSConfig> {
    return this.transport.json<DNSOSConfig>("dns-osconfig")
  }
}
