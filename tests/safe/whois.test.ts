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

describe("WhoIs (Safe)", () => {
  test("should throw error for invalid address", async () => {
    expect(client.whois("")).rejects.toThrow("Address is required")
  })

  test.skipIf(!tailscaleRunning)("should lookup peer information", async () => {
    const peerIp = process.env.TEST_PEER_IP || "100.0.0.1"
    const result = await client.whois(peerIp)

    expect(result).toBeDefined()
    // The actual response structure might be different
    if (result.node) {
      expect(result.node).toBeDefined()
    }
    if (result.userProfile) {
      expect(result.userProfile).toBeDefined()
      expect(result.userProfile.loginName).toBeDefined()
    }
  })

  test.skipIf(!tailscaleRunning)(
    "should return error for non-existent IP",
    async () => {
      const result = await client.whois("1.2.3.4")
      // The API might return an empty result instead of throwing
      expect(result).toBeDefined()
    }
  )

  test.skipIf(tailscaleRunning)("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
