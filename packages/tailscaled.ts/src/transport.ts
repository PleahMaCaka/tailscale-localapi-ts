import { camelizeKeys } from "./camel"
import {
  AccessDeniedError,
  DaemonUnreachableError,
  LocalApiError,
  PeerNotFoundError,
  PreconditionsFailedError,
  TailscaledError
} from "./errors"
import type { ClientOptions } from "./types"

const API_VERSION = "v0"
const DEFAULT_SOCKET_PATH = "/var/run/tailscale/tailscaled.sock"
const DEFAULT_TIMEOUT = 30_000

function defaultSocketPath(): string {
  return (
    process.env.TAILSCALE_LOCALAPI_SOCKET ??
    process.env.TS_LOCALAPI_SOCKET ??
    DEFAULT_SOCKET_PATH
  )
}

function socketIsUnreachable(platform: string): boolean {
  return platform === "win32" || platform === "darwin"
}

function isConnectionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code

  return code === "ECONNREFUSED" || code === "ENOENT" || code === "ENOTFOUND"
}

export function jsonInit(method: string, body?: unknown): RequestInit {
  if (body === undefined) return { method }

  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }
}

export class Transport {
  readonly socketPath: string

  readonly timeout: number

  readonly useCli: boolean

  constructor(options: ClientOptions = {}) {
    this.socketPath = options.socketPath ?? defaultSocketPath()
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
    this.useCli = options.useCli ?? socketIsUnreachable(process.platform)
  }

  async json<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
    if (this.useCli) return camelizeKeys(await this.viaCli(endpoint, init)) as T

    const response = await this.viaSocket(endpoint, init)
    if (response.status === 204) return {} as T

    return camelizeKeys(await response.json()) as T
  }

  async text(endpoint: string, init: RequestInit = {}): Promise<string> {
    if (this.useCli) {
      const raw = await this.viaCli(endpoint, init, false)

      return typeof raw === "string" ? raw : JSON.stringify(raw)
    }

    return (await this.viaSocket(endpoint, init)).text()
  }

  async send(endpoint: string, init: RequestInit = {}): Promise<void> {
    if (this.useCli) {
      await this.viaCli(endpoint, init)

      return
    }

    await (await this.viaSocket(endpoint, init)).text()
  }

  private async viaSocket(
    endpoint: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(
        `http://local-tailscaled.sock/localapi/${API_VERSION}/${endpoint}`,
        { ...init, signal: controller.signal, unix: this.socketPath }
      )

      if (!response.ok) throw await toApiError(response)

      return response
    } catch (error) {
      if (isConnectionError(error))
        throw new DaemonUnreachableError(this.socketPath)

      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  private async viaCli(
    endpoint: string,
    init: RequestInit,
    parse = true
  ): Promise<unknown> {
    const args = [
      "debug",
      "localapi",
      init.method ?? "GET",
      `${API_VERSION}/${endpoint}`
    ]
    if (typeof init.body === "string") args.push(init.body)

    const child = Bun.spawn(["tailscale", ...args], {
      stdout: "pipe",
      stderr: "pipe"
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited
    ])

    if (exitCode !== 0) throw toCliError(stderr, exitCode)

    if (!parse) return stdout

    try {
      return JSON.parse(stdout)
    } catch {
      return stdout
    }
  }
}

async function toApiError(response: Response): Promise<Error> {
  const body = (await response.text()).trim()

  if (response.status === 403)
    return new AccessDeniedError(body || "Access denied")

  if (response.status === 404) return new PeerNotFoundError(body || "Not found")

  if (response.status === 412)
    return new PreconditionsFailedError(body || "Preconditions failed")

  return new LocalApiError(response.status, body)
}

function toCliError(stderr: string, exitCode: number): Error {
  const message = stderr.trim() || `tailscale CLI exited with ${exitCode}`
  const lowered = message.toLowerCase()

  if (
    lowered.includes("not running") ||
    lowered.includes("cannot connect") ||
    lowered.includes("connection refused")
  )
    return new DaemonUnreachableError("tailscale CLI")

  if (lowered.includes("access denied")) return new AccessDeniedError(message)

  if (lowered.includes("not found")) return new PeerNotFoundError(message)

  return new TailscaledError(message)
}
