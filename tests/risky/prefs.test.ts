import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import TailscaleLocalAPI, { type Prefs } from "../../src/index"

const client = new TailscaleLocalAPI()
let originalPrefs: Prefs | null = null

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
  "Preferences (Risky)",
  () => {
    beforeEach(async () => {
      originalPrefs = await client.getPrefs()
    })

    afterEach(async () => {
      if (originalPrefs) {
        try {
          await client.editPrefs(originalPrefs)
          console.log("Restored original preferences")
        } catch (error) {
          console.error("Failed to restore preferences:", error)
          throw error
        }
      }
    })

    test("should get current preferences", async () => {
      const prefs = await client.getPrefs()

      expect(prefs).toBeDefined()
      expect(typeof prefs.HostName).toBe("string")
      expect(typeof prefs.AcceptRoutes).toBe("boolean")
    })

    test("should validate preferences", async () => {
      const prefs = await client.getPrefs()
      const result = await client.checkPrefs(prefs)

      expect(result).toBeDefined()
    })

    test("should check prefs without error", async () => {
      const prefs = await client.getPrefs()
      const result = await client.checkPrefs(prefs)

      expect(result.error).toBeUndefined()
    })
  }
)

describe.skipIf(tailscaleRunning)("Preferences (Risky - Skipped)", () => {
  test("requires Tailscale daemon", () => {
    console.log("Skipping - Tailscale daemon not running")
    expect(true).toBe(true)
  })
})
