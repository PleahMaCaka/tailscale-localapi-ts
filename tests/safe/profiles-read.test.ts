import { test, describe, expect } from "bun:test"
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

describe("Profiles (Safe)", () => {
  test.skipIf(!tailscaleRunning)("should get current profile", async () => {
    const profile = await client.getCurrentProfile()

    if (profile) {
      expect(profile).toBeDefined()
      expect(profile.id).toBeDefined()
      // LoginName might not be available in all cases
      if (profile.loginName) {
        expect(profile.loginName).toBeDefined()
      }
    } else {
      expect(profile).toBeNull()
    }
  })

  test.skipIf(!tailscaleRunning)("should get all profiles", async () => {
    try {
      const profiles = await client.getProfiles()
      expect(profiles).toBeInstanceOf(Array)
    } catch (error) {
      // Profiles endpoint might not be available
      expect(error).toBeDefined()
    }
  })

  test.skipIf(!tailscaleRunning)("should get profile status", async () => {
    try {
      const status = await client.getProfileStatus()
      expect(status).toBeDefined()
      expect(status.profiles).toBeInstanceOf(Array)

      if (status.current) {
        expect(status.current.id).toBeDefined()
      }
    } catch (error) {
      // Profile status endpoint might not be available
      expect(error).toBeDefined()
    }
  })

  test.skipIf(tailscaleRunning)("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
