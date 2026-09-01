import { describe, expect, test } from "bun:test"
import { breakingAllowed, control } from "../harness"

describe.skipIf(!breakingAllowed)("expire", () => {
  test("kicks a node off until it logs in again", async () => {
    const [first] = await control.nodes.fetch()
    if (!first) return

    await control.nodes.expire(first.id)
    const after = await control.nodes.fetch(first.id)

    expect(Date.parse(after.expires ?? "")).toBeLessThanOrEqual(Date.now())
  })
})
