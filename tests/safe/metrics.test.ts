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

describe("Metrics (Safe)", () => {
  test.skipIf(!tailscaleRunning)("should get daemon metrics", async () => {
    const metrics = await client.getDaemonMetrics()

    expect(typeof metrics).toBe("string")
    expect(metrics.length).toBeGreaterThan(0)
  })

  test.skipIf(!tailscaleRunning)("should get user metrics", async () => {
    const metrics = await client.getUserMetrics()

    expect(typeof metrics).toBe("string")
    expect(metrics.length).toBeGreaterThan(0)
  })

  test.skipIf(!tailscaleRunning)("should get goroutines dump", async () => {
    const goroutines = await client.getGoroutines()

    expect(typeof goroutines).toBe("string")
    expect(goroutines.length).toBeGreaterThan(0)
  })

  test.skipIf(tailscaleRunning)("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
