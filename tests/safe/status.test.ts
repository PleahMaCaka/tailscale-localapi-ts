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

describe("Status (Safe)", () => {
  test.skipIf(!tailscaleRunning)("should get current status", async () => {
    const status = await client.status()
    expect(status).toBeDefined()
    expect(status.backendState).toBeDefined()
  })

  test.skipIf(!tailscaleRunning)(
    "should have valid version string",
    async () => {
      const status = await client.status()
      expect(typeof status.version).toBe("string")
      expect(status.version.length).toBeGreaterThan(0)
    }
  )

  test.skipIf(tailscaleRunning)("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
