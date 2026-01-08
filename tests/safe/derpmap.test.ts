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
    expect(typeof derpMap.Regions).toBe("object")
    expect(Object.keys(derpMap.Regions).length).toBeGreaterThan(0)
  })

  test.skipIf(!tailscaleRunning)(
    "should have valid region structure",
    async () => {
      const derpMap = await client.getDERPMap()
      const firstRegion = Object.values(derpMap.Regions)[0] as DERPRegion

      expect(firstRegion).toBeDefined()
      expect(firstRegion.RegionID).toBeNumber()
      expect(firstRegion.RegionCode).toBeString()
      expect(firstRegion.RegionName).toBeString()
      expect(firstRegion.Nodes).toBeInstanceOf(Array)
    }
  )

  test.skipIf(tailscaleRunning)("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
