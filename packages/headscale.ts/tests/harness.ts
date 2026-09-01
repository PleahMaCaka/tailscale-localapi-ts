import { Tailnet } from "tailnet.ts"
import { headscale } from "../src"

export const backend = headscale({
  url: process.env.HEADSCALE_URL ?? "http://127.0.0.1:8080",
  apiKey: process.env.HEADSCALE_API_KEY ?? "unset"
})

export const control = new Tailnet(backend)

export const serverUp = await control.isReachable()

export const destructionAllowed =
  serverUp && process.env.HEADSCALE_TEST_DANGER === "1"
