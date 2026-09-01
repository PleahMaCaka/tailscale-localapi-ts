import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import type { Prefs } from "../../src"
import { client, writesAllowed } from "../harness"

let original: Prefs | null = null

describe.skipIf(!writesAllowed)("prefs.edit", () => {
  beforeAll(async () => {
    original = await client.prefs.fetch()
  })

  afterAll(async () => {
    if (original) await client.prefs.edit({ hostname: original.hostname })
  })

  test("applies a patched field through the prefs mask", async () => {
    const probe = `tailscale-ts-test-${process.pid}`

    expect((await client.prefs.edit({ hostname: probe })).hostname).toBe(probe)
  })

  test("leaves untouched fields alone", async () => {
    const before = await client.prefs.fetch()
    await client.prefs.edit({ hostname: before.hostname })
    const after = await client.prefs.fetch()

    expect(after.routeAll).toBe(before.routeAll)
    expect(after.controlUrl).toBe(before.controlUrl)
  })
})
