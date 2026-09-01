import { Tailscaled } from "../src"

export const client = new Tailscaled()

export const daemonUp = await client.isRunning()

export const writesAllowed =
  daemonUp && process.env.TAILSCALE_TEST_WRITE === "1"

export const breakingAllowed =
  writesAllowed && process.env.TAILSCALE_TEST_BREAKING === "1"
