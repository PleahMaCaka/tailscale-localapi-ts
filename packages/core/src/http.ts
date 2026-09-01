import {
  ApiError,
  ConflictError,
  InvalidRequestError,
  NotFoundError,
  ServerUnreachableError,
  UnauthorizedError
} from "./errors"

const DEFAULT_TIMEOUT = 15_000

/** @internal */
export interface HttpOptions {
  baseUrl: string
  apiKey: string
  timeout?: number
  /** Pulls a human message out of whatever error body the server returns. */
  readErrorMessage?: (body: unknown, raw: string) => string
}

/** @internal */
export interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  accept?: string
  /** Return the raw text instead of parsing it, for HuJSON policy documents. */
  asText?: boolean
}

/** @internal */
export interface HttpResponse<T> {
  data: T
  headers: Headers
}

function isConnectionError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code

  return code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "EAI_AGAIN"
}

/** @internal */
export function trimTrailingSlash(value: string): string {
  let end = value.length
  while (end > 0 && value[end - 1] === "/") end -= 1

  return value.slice(0, end)
}

function toError(status: number, message: string): Error {
  if (status === 401 || status === 403) return new UnauthorizedError(message)
  if (status === 404) return new NotFoundError(message)
  if (status === 400 || status === 422) return new InvalidRequestError(message)
  if (status === 409 || status === 412) return new ConflictError(message)

  return new ApiError(status, message)
}

/**
 * Bearer-authenticated JSON over HTTP, shared by both control planes.
 *
 * @internal
 */
export class Http {
  readonly baseUrl: string

  private readonly apiKey: string

  private readonly timeout: number

  private readonly readErrorMessage: (body: unknown, raw: string) => string

  constructor(options: HttpOptions) {
    if (!options.baseUrl) throw new Error("A control plane needs a base url")
    if (!options.apiKey) throw new Error("A control plane needs an api key")

    this.baseUrl = trimTrailingSlash(options.baseUrl)
    this.apiKey = options.apiKey
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
    this.readErrorMessage =
      options.readErrorMessage ?? ((_body, raw) => raw.trim())
  }

  async request<T>(
    path: string,
    options: RequestOptions = {}
  ): Promise<HttpResponse<T>> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers
    }
    if (options.accept) headers.Accept = options.accept
    if (options.body !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    const body =
      options.body === undefined
        ? undefined
        : typeof options.body === "string"
          ? options.body
          : JSON.stringify(options.body)

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? "GET",
        headers,
        body,
        signal: controller.signal
      })

      const raw = await response.text()

      if (!response.ok) {
        let parsed: unknown = null
        try {
          parsed = raw ? JSON.parse(raw) : null
        } catch {
          parsed = null
        }

        throw toError(
          response.status,
          this.readErrorMessage(parsed, raw) || `HTTP ${response.status}`
        )
      }

      if (options.asText) {
        return { data: raw as T, headers: response.headers }
      }

      return {
        data: (raw ? JSON.parse(raw) : {}) as T,
        headers: response.headers
      }
    } catch (error) {
      if (isConnectionError(error)) {
        throw new ServerUnreachableError(this.baseUrl)
      }

      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  async json<T>(path: string, options: RequestOptions = {}): Promise<T> {
    return (await this.request<T>(path, options)).data
  }
}
