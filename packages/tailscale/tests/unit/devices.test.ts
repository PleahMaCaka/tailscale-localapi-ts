import { afterEach, describe, expect, test } from "bun:test"
import { Tailscale } from "../../src"
import { type Call, stubFetch } from "./stub"

const DEVICE = {
  id: "92960230385",
  nodeId: "n292kg92CNTRL",
  name: "pangolin.tailfe8c.ts.net",
  hostname: "pangolin",
  user: "amelie@example.com",
  addresses: ["100.87.74.78", "fd7a:115c:a1e0::1"],
  tags: ["tag:golink"],
  os: "linux",
  clientVersion: "v1.36.0",
  created: "2022-12-01T05:23:30Z",
  lastSeen: "2022-12-02T05:23:30Z",
  connectedToControl: false,
  expires: "2023-05-30T04:44:05Z",
  keyExpiryDisabled: false,
  authorized: true,
  isExternal: false,
  isEphemeral: false,
  sshEnabled: false,
  updateAvailable: false,
  blocksIncomingConnections: false,
  advertisedRoutes: ["10.0.0.0/16"],
  enabledRoutes: [],
  nodeKey: "nodekey:x",
  machineKey: ""
}

let restore = () => {}
let calls: Call[] = []

function control(routes: Record<string, { body?: unknown; status?: number }>) {
  const stub = stubFetch(routes)
  restore = stub.restore
  calls = stub.calls

  return new Tailscale({ tailnet: "example.com", apiKey: "tskey" })
}

afterEach(() => restore())

describe("tailscale devices", () => {
  test("maps a device onto the shared node shape", async () => {
    const [node] = await control({
      "/tailnet/example.com/devices": { body: { devices: [DEVICE] } }
    }).nodes.fetch()

    expect(node?.id).toBe("n292kg92CNTRL")
    expect(node?.name).toBe("pangolin")
    expect(node?.fqdn).toBe("pangolin.tailfe8c.ts.net")
    expect(node?.owner.name).toBe("amelie@example.com")
    expect(node?.online).toBe(false)
    expect(node?.lastSeen).toBe("2022-12-02T05:23:30Z")
    expect(node?.expires).toBe("2023-05-30T04:44:05Z")
    expect(node?.advertisedRoutes).toEqual(["10.0.0.0/16"])
    expect(node?.os).toBe("linux")
  })

  test("reports a connected device as having no last seen", async () => {
    const [node] = await control({
      "/tailnet/example.com/devices": {
        body: { devices: [{ ...DEVICE, connectedToControl: true }] }
      }
    }).nodes.fetch()

    expect(node?.online).toBe(true)
    expect(node?.lastSeen).toBeNull()
  })

  test("treats a disabled key expiry as never expiring", async () => {
    const [node] = await control({
      "/tailnet/example.com/devices": {
        body: { devices: [{ ...DEVICE, keyExpiryDisabled: true }] }
      }
    }).nodes.fetch()

    expect(node?.expires).toBeNull()
  })

  test("sends tags to the device endpoint", async () => {
    await control({ "POST /device/n292kg92CNTRL/tags": {} }).nodes.setTags(
      "n292kg92CNTRL",
      ["tag:a"]
    )

    expect(calls[0]?.method).toBe("POST")
    expect(calls[0]?.url).toBe("/device/n292kg92CNTRL/tags")
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ tags: ["tag:a"] })
  })

  test("sends enabled routes, never advertised ones", async () => {
    await control({ "POST /device/n1/routes": {} }).nodes.setRoutes("n1", [
      "10.0.0.0/16"
    ])

    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
      routes: ["10.0.0.0/16"]
    })
  })

  test("cannot rename, because Tailscale has no such endpoint", () => {
    expect(
      control({ "/tailnet/example.com/devices": { body: { devices: [] } } })
        .canRename
    ).toBe(false)
  })
})
