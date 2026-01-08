import type {
  ClientOptions,
  DERPMap,
  DNSOSConfig,
  DNSQueryResponse,
  LoginProfile,
  PartialPrefs,
  PingResult,
  Prefs,
  ProfileStatus,
  Status,
  Whois
} from "./types"
import {
  AccessDeniedError,
  PeerNotFoundError,
  PreconditionsFailedError
} from "./types"

export type {
  Status,
  Whois,
  Prefs,
  PartialPrefs,
  DERPMap,
  PingResult,
  DNSQueryResponse,
  DNSOSConfig,
  ProfileStatus,
  LoginProfile,
  ClientOptions,
  AccessDeniedError,
  PeerNotFoundError,
  PreconditionsFailedError
}

const API_VERSION = "v0"

function getDefaultSocketPath(): string {
  return "/var/run/tailscale/tailscaled.sock"
}

function getDefaultPort(): number {
  return 41112
}

function getSocketPath(): string {
  const envSocket =
    process.env.TAILSCALE_LOCALAPI_SOCKET || process.env.TS_LOCALAPI_SOCKET
  if (envSocket) {
    return envSocket
  }
  return getDefaultSocketPath()
}

function isWindows(): boolean {
  return process.platform === "win32"
}

function isDarwin(): boolean {
  return process.platform === "darwin"
}

async function runCLI(
  method: string,
  path: string,
  body?: unknown
): Promise<unknown> {
  const args = ["debug", "localapi", method, `${API_VERSION}/${path}`]
  if (body) {
    args.push(JSON.stringify(body))
  }

  const process = Bun.spawn(["tailscale", ...args], {
    stdout: "pipe",
    stderr: "ignore"
  })

  const output = await new Response(process.stdout).text()

  if (output.trim() === "") {
    throw new Error("Empty response from CLI")
  }

  try {
    return JSON.parse(output)
  } catch {
    return output
  }
}

export class TailscaleLocalAPI {
  private socketPath: string
  private timeout: number
  private useCLI: boolean

  constructor(options: ClientOptions = {}) {
    this.socketPath = options.socketPath || getSocketPath()
    this.timeout = options.timeout ?? 30000

    if (isWindows() || isDarwin()) {
      this.useCLI = true
    } else {
      this.useCLI = false
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (this.useCLI) {
      const method = options.method || "GET"
      const body = options.body ? JSON.parse(options.body as string) : undefined
      return runCLI(method, endpoint, body) as Promise<T>
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    const url = `http://local-tailscaled.sock/localapi/${API_VERSION}/${endpoint}`
    const fetchOptions: RequestInit = {
      ...options,
      signal: controller.signal
    }

    try {
      const response = await fetch(url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        await this.handleError(response)
      }

      if (response.status === 204) {
        return {} as T
      }

      return (await response.json()) as T
    } catch (error) {
      clearTimeout(timeoutId)

      const err = error as { code?: string }
      if (err?.code === "ECONNREFUSED" || err?.code === "ENOTFOUND") {
        throw new Error(
          "Cannot connect to Tailscale daemon. " +
            `Unix socket: ${this.socketPath}`
        )
      }

      throw error
    }
  }

  private async handleError(response: Response): Promise<never> {
    const text = await response.text()

    if (response.status === 403) {
      throw new AccessDeniedError(text || "Access denied")
    }
    if (response.status === 404) {
      throw new PeerNotFoundError(text || "Peer not found")
    }
    if (response.status === 412) {
      throw new PreconditionsFailedError(text || "Preconditions failed")
    }

    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  async status(peers = true): Promise<Status> {
    const query = peers ? "" : "?peers=false"
    return this.request<Status>(`status${query}`)
  }

  async statusWithoutPeers(): Promise<Status> {
    return this.request<Status>("status?peers=false")
  }

  async whois(addr: string): Promise<Whois> {
    if (!addr) {
      throw new Error("Address is required")
    }
    return this.request<Whois>(`whois?addr=${encodeURIComponent(addr)}`)
  }

  async getPrefs(): Promise<Prefs> {
    return this.request<Prefs>("prefs")
  }

  async editPrefs(prefs: PartialPrefs): Promise<Prefs> {
    return this.request<Prefs>("prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs)
    })
  }

  async checkPrefs(prefs: Prefs): Promise<{ error?: string }> {
    return this.request<{ error?: string }>("check-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs)
    })
  }

  async getDERPMap(): Promise<DERPMap> {
    return this.request<DERPMap>("derpmap")
  }

  async ping(
    ip: string,
    type = "taildrop",
    size?: number
  ): Promise<PingResult> {
    const params = new URLSearchParams({ ip, type })
    if (size !== undefined) {
      params.append("size", size.toString())
    }
    return this.request<PingResult>(`ping?${params.toString()}`, {
      method: "POST"
    })
  }

  async getCurrentProfile(): Promise<LoginProfile | null> {
    try {
      return await this.request<LoginProfile>("profiles/current")
    } catch {
      return null
    }
  }

  async getProfiles(): Promise<LoginProfile[]> {
    return this.request<LoginProfile[]>("profiles")
  }

  async getProfileStatus(): Promise<ProfileStatus> {
    const [current, profiles] = await Promise.all([
      this.getCurrentProfile(),
      this.getProfiles()
    ])
    return {
      Current: current as LoginProfile,
      Profiles: profiles
    }
  }

  async switchProfile(profileId: string): Promise<void> {
    await this.request(`profiles/${encodeURIComponent(profileId)}`, {
      method: "POST"
    })
  }

  async createProfile(): Promise<void> {
    await this.request("profiles", {
      method: "PUT"
    })
  }

  async deleteProfile(profileId: string): Promise<void> {
    await this.request(`profiles/${encodeURIComponent(profileId)}`, {
      method: "DELETE"
    })
  }

  async loginInteractive(): Promise<void> {
    await this.request("login-interactive", {
      method: "POST"
    })
  }

  async logout(): Promise<void> {
    await this.request("logout", {
      method: "POST"
    })
  }

  async resetAuth(): Promise<void> {
    await this.request("reset-auth", {
      method: "POST"
    })
  }

  async start(options: Record<string, unknown> = {}): Promise<void> {
    await this.request("start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options)
    })
  }

  async shutdown(): Promise<void> {
    await this.request("shutdown", {
      method: "POST"
    })
  }

  async reloadConfig(): Promise<{ reloaded: boolean; error?: string }> {
    return this.request<{ reloaded: boolean; error?: string }>(
      "reload-config",
      { method: "POST" }
    )
  }

  async queryDNS(name: string, type = "A"): Promise<DNSQueryResponse> {
    const params = new URLSearchParams({ name, type })
    return this.request<DNSQueryResponse>(`dns-query?${params.toString()}`)
  }

  async getDNSOSConfig(): Promise<DNSOSConfig> {
    return this.request<DNSOSConfig>("dns-osconfig")
  }

  async getDaemonMetrics(): Promise<string> {
    return this.request<string>("metrics")
  }

  async getUserMetrics(): Promise<string> {
    return this.request<string>("usermetrics")
  }

  async getGoroutines(): Promise<string> {
    return this.request<string>("goroutines")
  }

  async checkIPForwarding(): Promise<{ warning?: string }> {
    return this.request<{ warning?: string }>("check-ip-forwarding")
  }

  async checkSOMarkInUse(): Promise<{ useSOMark: boolean }> {
    return this.request<{ useSOMark: boolean }>("check-so-mark-in-use")
  }
}

export default TailscaleLocalAPI
