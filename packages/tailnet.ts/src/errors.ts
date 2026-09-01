export class TailnetError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class ServerUnreachableError extends TailnetError {
  readonly url: string

  constructor(url: string) {
    super(`Cannot reach the control server at ${url}`)
    this.url = url
  }
}

export class UnauthorizedError extends TailnetError {}

export class NotFoundError extends TailnetError {}

export class InvalidRequestError extends TailnetError {}

export class ConflictError extends TailnetError {}

/** Any other failure the server reported. */
export class ApiError extends TailnetError {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
