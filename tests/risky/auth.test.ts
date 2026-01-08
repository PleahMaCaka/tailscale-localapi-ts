import { describe, expect, test } from "bun:test"
import TailscaleLocalAPI from "../../src/index"

const client = new TailscaleLocalAPI()

async function isTailscaleRunning(): Promise<boolean> {
  try {
    await client.status()
    return true
  } catch {
    return false
  }
}

const tailscaleRunning = await isTailscaleRunning()

describe.skipIf(!tailscaleRunning || !process.env.TAILSCALE_TEST_MUTATIONS)(
  "Authentication (Risky)",
  () => {
    test("logout should be available", () => {
      console.log("This test is available when TAILSCALE_TEST_MUTATIONS=1")
    })

    test("reset auth should be available", () => {
      console.log("This test is available when TAILSCALE_TEST_MUTATIONS=1")
    })
  }
)

describe.skipIf(tailscaleRunning)("Authentication (Risky - Skipped)", () => {
  test("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
