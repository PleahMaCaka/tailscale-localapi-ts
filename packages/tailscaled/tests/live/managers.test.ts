import { describe, expect, test } from "bun:test"
import { client, daemonUp } from "../harness"

describe.skipIf(!daemonUp)("prefs manager", () => {
  test("exposes the real ipn.Prefs fields", async () => {
    const prefs = await client.prefs.fetch()

    expect(prefs.controlUrl).toBeString()
    expect(prefs.wantRunning).toBeBoolean()
    expect(prefs.routeAll).toBeBoolean()
  })

  test("validates without applying", async () => {
    const result = await client.prefs.check(await client.prefs.fetch())

    expect(result.error).toBeUndefined()
  })
})

describe.skipIf(!daemonUp)("profiles manager", () => {
  test("lists profiles from the trailing-slash endpoint", async () => {
    expect(await client.profiles.fetch()).toBeInstanceOf(Array)
  })

  test("returns the current profile or null", async () => {
    const profile = await client.profiles.current()
    if (!profile) return

    expect(profile.id).toBeString()
    expect(profile.userProfile.loginName).toBeString()
  })

  test("combines current and list", async () => {
    expect((await client.profiles.status()).profiles).toBeInstanceOf(Array)
  })
})

describe.skipIf(!daemonUp)("metrics manager", () => {
  test("returns prometheus text, not json", async () => {
    expect(await client.metrics.daemon()).toContain("# TYPE")
  })

  test("returns user metrics and goroutines as text", async () => {
    expect(await client.metrics.user()).toBeString()
    expect((await client.metrics.goroutines()).length).toBeGreaterThan(0)
  })
})

describe.skipIf(!daemonUp)("dns manager", () => {
  test("resolves a name through the daemon", async () => {
    const answer = await client.dns.query("example.com")

    expect(answer.resolvers).toBeInstanceOf(Array)
  })

  test("reports the os config, or says it does not manage one", async () => {
    try {
      expect((await client.dns.osConfig()).nameservers).toBeInstanceOf(Array)
    } catch (error) {
      // a userspace-networking daemon never touches the OS resolver
      expect((error as Error).message).toContain("not supported")
    }
  })
})
