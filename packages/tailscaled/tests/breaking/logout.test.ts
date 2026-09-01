import { describe, expect, test } from "bun:test"
import { breakingAllowed, client } from "../harness"

describe.skipIf(!breakingAllowed)("logout", () => {
  test("leaves the daemon needing login", async () => {
    await client.logout()

    expect((await client.status(false)).backendState).toBe("NeedsLogin")
  })
})
