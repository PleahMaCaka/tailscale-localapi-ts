import { describe, expect, test } from "bun:test"
import TailscaleLocalAPI, { type DERPRegion } from "../../src/index"

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

describe("DERP Map (Safe)", () => {
  test.skipIf(!tailscaleRunning)("should get DERP map", async () => {
    const derpMap = await client.getDERPMap()

    expect(derpMap).toBeDefined()
    expect(typeof derpMap.regions).toBe("object")
    expect(Object.keys(derpMap.regions).length).toBeGreaterThan(0)
  })

  test.skipIf(!tailscaleRunning)(
    "should have valid region structure",
    async () => {
      const derpMap = await client.getDERPMap()
      const firstRegion = Object.values(derpMap.regions)[0] as DERPRegion

      expect(firstRegion).toBeDefined()
      expect(firstRegion.regionId).toBeNumber()
      expect(firstRegion.regionCode).toBeString()
      expect(firstRegion.regionName).toBeString()
      expect(firstRegion.nodes).toBeInstanceOf(Array)
    }
  )

  test.skipIf(tailscaleRunning)("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
