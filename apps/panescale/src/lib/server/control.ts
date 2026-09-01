import type { Tailnet } from "@tailnet/core"
import { Headscale } from "@tailnet/headscale"
import { Tailscale } from "@tailnet/tailscale"
import { env } from "$env/dynamic/private"

export type ControlKind = "headscale" | "tailscale" | "none"

export interface ControlStatus {
  kind: ControlKind
  target: string
}

let cached: Tailnet | null = null

function build(): Tailnet | null {
  if (env.HEADSCALE_API_KEY) {
    return new Headscale({
      url: env.HEADSCALE_URL ?? "http://127.0.0.1:8080",
      apiKey: env.HEADSCALE_API_KEY
    })
  }

  if (env.TAILSCALE_API_KEY) {
    return new Tailscale({
      tailnet: env.TAILSCALE_TAILNET,
      apiKey: env.TAILSCALE_API_KEY
    })
  }

  return null
}

/** The control plane client, or `null` when nothing is configured. */
export function control(): Tailnet | null {
  cached ??= build()

  return cached
}

export function requireControl(): Tailnet {
  const client = control()
  if (!client) throw new Error("No control plane is configured")

  return client
}

export function requireHeadscale(): Headscale {
  const client = requireControl()
  if (!(client instanceof Headscale)) {
    throw new Error("Only Headscale can do this")
  }

  return client
}

export function controlStatus(): ControlStatus {
  if (env.HEADSCALE_API_KEY) {
    return {
      kind: "headscale",
      target: env.HEADSCALE_URL ?? "http://127.0.0.1:8080"
    }
  }

  if (env.TAILSCALE_API_KEY) {
    return { kind: "tailscale", target: env.TAILSCALE_TAILNET ?? "-" }
  }

  return { kind: "none", target: "" }
}
