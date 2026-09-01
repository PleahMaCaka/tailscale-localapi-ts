import { Headscale } from "../src"

export const control = new Headscale({
  url: process.env.HEADSCALE_URL ?? "http://127.0.0.1:8080",
  apiKey: process.env.HEADSCALE_API_KEY ?? "unset"
})

export const serverUp = await control.isReachable()

export const breakingAllowed =
  serverUp && process.env.HEADSCALE_TEST_BREAKING === "1"
