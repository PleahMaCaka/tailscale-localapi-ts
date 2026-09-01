import { afterEach, describe, expect, test } from "bun:test"
import { Tailscale } from "../../src"
import { type Call, stubFetch } from "./stub"

let restore = () => {}
let calls: Call[] = []

function control(routes: Parameters<typeof stubFetch>[0]) {
  const stub = stubFetch(routes)
  restore = stub.restore
  calls = stub.calls

  return new Tailscale({ tailnet: "example.com", apiKey: "tskey" })
}

afterEach(() => restore())

describe("tailscale policy", () => {
  test("reads the document as text and keeps the etag as the version", async () => {
    const policy = await control({
      "/tailnet/example.com/acl": {
        text: '{ "acls": [] } // hujson',
        headers: { etag: '"e0b2816b418"' }
      }
    }).policy.fetch()

    expect(policy.policy).toContain("hujson")
    expect(policy.version).toBe('"e0b2816b418"')
  })

  test("sends the version back as If-Match", async () => {
    await control({
      "POST /tailnet/example.com/acl": { text: "{}" }
    }).policy.set("{}", '"e0b2816b418"')

    expect(calls[0]?.headers["If-Match"]).toBe('"e0b2816b418"')
    expect(calls[0]?.headers["Content-Type"]).toBe("application/hujson")
  })

  test("omits If-Match when no version is given", async () => {
    await control({
      "POST /tailnet/example.com/acl": { text: "{}" }
    }).policy.set("{}")

    expect(calls[0]?.headers["If-Match"]).toBeUndefined()
  })
})

describe("tailscale keys", () => {
  test("fills in capabilities by fetching each listed key", async () => {
    const keys = await control({
      "/tailnet/example.com/keys": { body: { keys: [{ id: "k1" }] } },
      "/tailnet/example.com/keys/k1": {
        body: {
          id: "k1",
          created: "2021-12-09T23:22:39Z",
          expires: "2022-03-09T23:22:39Z",
          capabilities: {
            devices: {
              create: { reusable: true, ephemeral: false, tags: ["tag:a"] }
            }
          }
        }
      }
    }).keys.fetch()

    expect(keys[0]?.reusable).toBe(true)
    expect(keys[0]?.tags).toEqual(["tag:a"])
    expect(keys[0]?.secret).toBeNull()
  })

  test("returns the secret only on creation", async () => {
    const created = await control({
      "POST /tailnet/example.com/keys": {
        body: {
          id: "k2",
          key: "tskey-auth-abc",
          created: "2021-12-09T23:22:39Z",
          expires: "2022-03-09T23:22:39Z",
          capabilities: { devices: { create: { reusable: false, tags: [] } } }
        }
      }
    }).keys.create({ expirySeconds: 86400, tags: [] })

    expect(created.secret).toBe("tskey-auth-abc")
    expect(JSON.parse(calls[0]?.body ?? "{}").expirySeconds).toBe(86400)
  })

  test("revokes by key id", async () => {
    await control({ "DELETE /tailnet/example.com/keys/k9": {} }).keys.revoke({
      id: "k9",
      secret: null,
      reusable: false,
      ephemeral: false,
      tags: [],
      createdAt: "",
      expires: null,
      used: false,
      raw: null
    })

    expect(calls[0]?.method).toBe("DELETE")
    expect(calls[0]?.url).toBe("/tailnet/example.com/keys/k9")
  })
})
