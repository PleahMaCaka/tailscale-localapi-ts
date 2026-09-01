export class TailscaledError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class DaemonUnreachableError extends TailscaledError {
  readonly socketPath: string

  constructor(socketPath: string) {
    super(`Cannot reach the tailscaled daemon at ${socketPath}`)
    this.socketPath = socketPath
  }
}

export class AccessDeniedError extends TailscaledError {}

export class PeerNotFoundError extends TailscaledError {}

export class PreconditionsFailedError extends TailscaledError {}

export class LocalApiError extends TailscaledError {
  readonly status: number

  constructor(status: number, message: string) {
    super(`HTTP ${status}: ${message}`)
    this.status = status
  }
}
