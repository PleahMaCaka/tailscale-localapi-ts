import { describe, expect, test } from "bun:test"
import { client, destructionAllowed } from "../harness"

describe.skipIf(!destructionAllowed)("logout", () => {
  test("leaves the daemon needing login", async () => {
    await client.logout()

    expect((await client.status(false)).backendState).toBe("NeedsLogin")
  })
})
