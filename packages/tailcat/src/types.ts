export interface TailcatOptions {
  /** Path to the `tailcat` binary. Defaults to `tailcat` on `PATH`. */
  binary?: string

  /**
   * `new` for an ephemeral key, a saved key name, or a path to a
   * `*.private.json`. Empty means the CLI's own default: the saved
   * `default` key in server mode, `client-default` in client modes, else an
   * ephemeral key.
   */
  key?: string

  /** URL of the JSON DERP map used to pick or resolve a region. */
  derpMapUrl?: string

  /** Milliseconds to wait for one-shot commands before killing them. */
  timeout?: number
}

/** A port, a port range like `8000-8010`, or one of the named services. */
export type TailcatService =
  | number
  | `${number}-${number}`
  | "all"
  | "exit-node"
  | "no-auth-ssh"
  | "files"

export interface ServeOptions {
  /** Public keys allowed to connect, or `none`. Empty allows everyone. */
  allow?: string[] | "none"

  /** Embed the DERP server info in the address so clients skip the map fetch. */
  fullAddress?: boolean

  /**
   * Directory for the `files` service, with an optional `:ro`, `:rw` or
   * `:wo` suffix. Implies the `files` service.
   */
  files?: string
}

export interface TailcatServer {
  /** The connection token to hand to the other side. */
  address: string

  /** Resolves with the exit code once the server process ends. */
  exited: Promise<number>

  /** Stops the server. The address dies with it when the key was ephemeral. */
  stop(): void
}

export interface TailcatConnection {
  /** Bytes arriving from the remote port. */
  readable: ReadableStream<Uint8Array>

  /** Bytes to send to the remote port. Call `end()` to half-close. */
  writable: WritableStream<Uint8Array>

  /** Resolves with the exit code once the tunnel process ends. */
  exited: Promise<number>

  close(): void
}

export interface DerpNode {
  HostName: string
  IPv4?: string
  IPv6?: string
}

export interface ParsedAddress {
  ServerPublic: string
  /** Present on short tokens that reference a region of the DERP map. */
  RegionID?: number
  /** Present on self-contained tokens with the relay info embedded. */
  Region?: { Nodes: DerpNode[] }[]
}

export interface PingOptions {
  /** Keep pinging until a pong arrives over a direct path. */
  untilDirect?: boolean

  /** Milliseconds before the CLI gives up. Defaults to 10 seconds. */
  timeout?: number
}

export type Pong =
  | { via: "derp"; relay: string; latencyMs: number }
  | { via: "direct"; endpoint: string; latencyMs: number }

export interface GenkeyOptions {
  /** Generate a client identity instead of a server key. */
  client?: boolean

  /** Region id, code, substring, or DERP hostname(s). Defaults to `auto`. */
  region?: string

  /** Pick the nearest region now and bake it into the key and token. */
  fixedRegion?: boolean

  /** Overwrite an existing key of the same name. */
  force?: boolean
}
