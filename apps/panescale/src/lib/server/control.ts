import { headscale } from "headscale.ts"
import { Tailnet } from "tailnet.ts"
import { tailscale } from "tailscale.ts"
import { env } from "$env/dynamic/private"

export type ControlKind = "headscale" | "tailscale" | "none"

export interface ControlStatus {
  kind: ControlKind
  target: string
}

let cached: Tailnet | null = null

function build(): Tailnet | null {
  if (env.HEADSCALE_API_KEY) {
    return new Tailnet(
      headscale({
        url: env.HEADSCALE_URL ?? "http://127.0.0.1:8080",
        apiKey: env.HEADSCALE_API_KEY
      })
    )
  }

  if (env.TAILSCALE_API_KEY) {
    return new Tailnet(
      tailscale({
        tailnet: env.TAILSCALE_TAILNET ?? "-",
        apiKey: env.TAILSCALE_API_KEY
      })
    )
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
