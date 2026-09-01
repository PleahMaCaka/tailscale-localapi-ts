import { describe, expect, test } from "bun:test"
import { PeerNotFoundError } from "../../src"
import { client, daemonUp } from "../harness"

describe.skipIf(!daemonUp)("status", () => {
  test("reports a backend state and version", async () => {
    const status = await client.status()

    expect(status.backendState).toBeString()
    expect(status.version.length).toBeGreaterThan(0)
  })

  test("camelizes self into the documented shape", async () => {
    const status = await client.status()

    expect(status.self.hostName).toBeString()
    expect(status.self.tailscaleIps).toBeInstanceOf(Array)
  })

  test("skips peers when asked", async () => {
    const status = await client.status(false)

    expect(Object.keys(status.peer ?? {})).toHaveLength(0)
  })
})

describe("whois", () => {
  test("rejects an empty address", async () => {
    expect(client.whois("")).rejects.toThrow("whois requires an address")
  })

  test.skipIf(!daemonUp)("resolves our own address", async () => {
    const self = (await client.status(false)).tailscaleIps?.[0]
    if (!self) return

    const whois = await client.whois(self)

    expect(whois.node.name).toBeString()
    expect(whois.userProfile.loginName).toBeString()
  })

  test.skipIf(!daemonUp)("fails outside the tailnet", async () => {
    expect(client.whois("1.2.3.4")).rejects.toBeInstanceOf(PeerNotFoundError)
  })
})

describe.skipIf(!daemonUp)("derp map", () => {
  test("returns regions keyed by id", async () => {
    const derpMap = await client.derpMap()

    expect(Object.values(derpMap.regions).length).toBeGreaterThan(0)
  })
})
