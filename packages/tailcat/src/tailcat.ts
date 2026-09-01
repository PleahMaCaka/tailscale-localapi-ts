import { Cli, DEFAULT_TIMEOUT, firstLine, parsePong } from "./cli"
import { TailcatError, TailcatExitError } from "./errors"
import type {
  GenkeyOptions,
  ParsedAddress,
  PingOptions,
  Pong,
  ServeOptions,
  TailcatConnection,
  TailcatOptions,
  TailcatServer,
  TailcatService
} from "./types"

/**
 * Drives the `tailcat` CLI: WireGuard tunnels between two machines with no
 * control plane, bootstrapped through a DERP relay.
 *
 * Needs the `tailcat` binary on `PATH` (or `binary` in the options) and the
 * Bun runtime. Tailcat itself promises no CLI stability, so pin the version
 * you tested against.
 *
 * @example
 * ```typescript
 * const tailcat = new Tailcat()
 *
 * const server = await tailcat.serve([8080])
 * console.log(server.address)
 *
 * const pongs = await tailcat.ping(server.address)
 * server.stop()
 * ```
 */
export class Tailcat {
  private readonly cli: Cli

  constructor(options: TailcatOptions = {}) {
    this.cli = new Cli(options)
  }

  /** Decodes an address without connecting to anything. */
  async parse(address: string): Promise<ParsedAddress> {
    return JSON.parse(await this.cli.run(["parse", address])) as ParsedAddress
  }

  /** Turns a short address into a self-contained one with the relay embedded. */
  async resolve(address: string): Promise<string> {
    return (await this.cli.run(["resolve", address])).trim()
  }

  /** Reports the CLI version. */
  async version(): Promise<string> {
    return (await this.cli.run(["version"])).trim()
  }

  /**
   * Pings a server and reports each pong and the path it took.
   *
   * With `untilDirect`, rejects with {@link TailcatExitError} when no direct
   * path came up before the timeout.
   */
  async ping(address: string, options: PingOptions = {}): Promise<Pong[]> {
    const args = ["ping"]
    if (options.untilDirect) args.push("--until-direct")
    if (options.timeout !== undefined)
      args.push(`--timeout=${options.timeout}ms`)
    args.push(address)

    const output = await this.cli.run(args)

    return output
      .split("\n")
      .map(parsePong)
      .filter((pong): pong is Pong => pong !== null)
  }

  /**
   * Starts a server and resolves once the other side can reach it.
   *
   * The CLI prints its address before it has joined the relay, so a client
   * acting on it at once gets its first packets dropped. This pings the new
   * server until a pong comes back, bounded by the `timeout` option.
   *
   * @remarks
   * Risk: **write**. Anyone holding the address reaches the listed ports on
   * this machine until {@link TailcatServer.stop} is called. With a saved key
   * the address stays valid across restarts.
   */
  async serve(
    services: TailcatService[],
    options: ServeOptions = {}
  ): Promise<TailcatServer> {
    if (services.length === 0 && !options.files) {
      throw new TailcatError("serve needs at least one port or service")
    }

    const args = ["--json", "serve"]
    if (options.allow) {
      const allow = options.allow === "none" ? "none" : options.allow.join(",")
      args.push(`--allow=${allow}`)
    }
    if (options.fullAddress) args.push("--full-address")
    if (options.files) args.push(`--files=${options.files}`)
    args.push(...services.map(String))

    const child = this.cli.spawn(args, "ignore")
    const { line } = await firstLine(child.stdout)

    let address: string
    try {
      address = (JSON.parse(line) as { listenAddr: string }).listenAddr
    } catch {
      const stderr = await new Response(child.stderr).text()
      child.kill()
      throw new TailcatExitError(await child.exited, stderr)
    }

    const deadline = Date.now() + (this.cli.options.timeout ?? DEFAULT_TIMEOUT)
    while (!(await this.answers(address))) {
      if (Date.now() > deadline) {
        child.kill()
        throw new TailcatError(`Server ${address} never became reachable`)
      }
    }

    return {
      address,
      exited: child.exited,
      stop: () => child.kill()
    }
  }

  private async answers(address: string): Promise<boolean> {
    try {
      return (await this.ping(address, { timeout: 2000 })).length > 0
    } catch (error) {
      if (error instanceof TailcatExitError) return false

      throw error
    }
  }

  /**
   * Opens a tunnel to one port on a server. Bytes flow both ways until the
   * process ends.
   */
  connect(address: string, port: number): TailcatConnection {
    const child = this.cli.spawn([address, String(port)], "pipe")

    return {
      readable: child.stdout,
      writable: new WritableStream<Uint8Array>({
        write: chunk => {
          child.stdin.write(chunk)
        },
        close: () => {
          child.stdin.end()
        }
      }),
      exited: child.exited,
      close: () => child.kill()
    }
  }

  /**
   * Generates and saves a key, returning the address it yields, or the public
   * key for a client identity.
   *
   * @remarks
   * Risk: **write**. Writes to the tailcat config directory. With `force`,
   * overwrites a key that other machines may already trust.
   */
  async genkey(name: string, options: GenkeyOptions = {}): Promise<string> {
    const args = ["genkey", `--key=${name}`]
    if (options.client) args.push("--client")
    if (options.region) args.push(`--region=${options.region}`)
    if (options.fixedRegion) args.push("--fixed-region")
    if (options.force) args.push("--force")

    return (await this.cli.run(args)).trim()
  }
}
