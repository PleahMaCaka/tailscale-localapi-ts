import { Tailscaled } from "../src"

export const client = new Tailscaled()

export const daemonUp = await client.isRunning()

export const mutationsAllowed =
  daemonUp && process.env.TAILSCALE_TEST_WRITE === "1"

export const destructionAllowed =
  mutationsAllowed && process.env.TAILSCALE_TEST_DANGER === "1"
