import { TailcatExitError, TailcatMissingError } from "./errors"
import type { Pong, TailcatOptions } from "./types"

export const DEFAULT_TIMEOUT = 30_000

const GO_UNIT_MS: Record<string, number> = {
  ns: 1e-6,
  µs: 1e-3,
  us: 1e-3,
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000
}

export function goDurationToMs(text: string): number {
  let total = 0
  let rest = text.trim()

  while (rest.length > 0) {
    const match = rest.match(/^(\d+(?:\.\d+)?)(ns|µs|us|ms|s|m|h)/)
    if (!match) throw new Error(`Not a Go duration: ${text}`)

    total += Number(match[1]) * (GO_UNIT_MS[match[2] as string] ?? 0)
    rest = rest.slice(match[0].length)
  }

  return total
}

export function parsePong(line: string): Pong | null {
  const match = line.match(/^pong in (\S+) via (.+)$/)
  if (!match) return null

  const latencyMs = goDurationToMs(match[1] as string)
  const via = match[2] as string
  const relay = via.match(/^DERP\((.*)\)$/)

  if (relay) return { via: "derp", relay: relay[1] as string, latencyMs }

  return { via: "direct", endpoint: via, latencyMs }
}

export function rootArgs(options: TailcatOptions): string[] {
  const args: string[] = []
  if (options.key) args.push(`--key=${options.key}`)
  if (options.derpMapUrl) args.push(`--derpmap-url=${options.derpMapUrl}`)

  return args
}

export class Cli {
  readonly binary: string

  readonly options: TailcatOptions

  constructor(options: TailcatOptions) {
    this.binary = options.binary ?? "tailcat"
    this.options = options
  }

  spawn<In extends "pipe" | "ignore">(args: string[], stdin: In) {
    if (!Bun.which(this.binary)) throw new TailcatMissingError(this.binary)

    return Bun.spawn([this.binary, ...rootArgs(this.options), ...args], {
      stdin,
      stdout: "pipe",
      stderr: "pipe"
    })
  }

  async run(args: string[]): Promise<string> {
    const child = this.spawn(args, "ignore")
    const timer = setTimeout(
      () => child.kill(),
      this.options.timeout ?? DEFAULT_TIMEOUT
    )

    try {
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited
      ])

      if (exitCode !== 0) throw new TailcatExitError(exitCode, stderr)

      return stdout
    } finally {
      clearTimeout(timer)
    }
  }
}

export async function firstLine(
  stream: ReadableStream<Uint8Array>
): Promise<{ line: string; rest: ReadableStream<Uint8Array> }> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffered = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffered += decoder.decode(value, { stream: true })
    const newline = buffered.indexOf("\n")
    if (newline === -1) continue

    const line = buffered.slice(0, newline)
    const leftover = new TextEncoder().encode(buffered.slice(newline + 1))
    reader.releaseLock()

    return { line, rest: prepend(leftover, stream) }
  }

  reader.releaseLock()

  return { line: buffered, rest: stream }
}

function prepend(
  head: Uint8Array,
  tail: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  if (head.length === 0) return tail

  const reader = tail.getReader()

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(head)
    },
    async pull(controller) {
      const { value, done } = await reader.read()
      if (done) controller.close()
      else controller.enqueue(value)
    },
    cancel(reason) {
      return reader.cancel(reason)
    }
  })
}
