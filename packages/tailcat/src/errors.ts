export class TailcatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class TailcatMissingError extends TailcatError {
  readonly binary: string

  constructor(binary: string) {
    super(`Cannot find the tailcat binary at ${binary}`)
    this.binary = binary
  }
}

/** The CLI exited non-zero. `stderr` holds what it printed. */
export class TailcatExitError extends TailcatError {
  readonly exitCode: number

  readonly stderr: string

  constructor(exitCode: number, stderr: string) {
    super(stderr.trim() || `tailcat exited with ${exitCode}`)
    this.exitCode = exitCode
    this.stderr = stderr
  }
}
