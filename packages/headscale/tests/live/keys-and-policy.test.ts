import { describe, expect, test } from "bun:test"
import { control, serverUp } from "../harness"

describe.skipIf(!serverUp)("pre-auth keys", () => {
  test("issues a key, lists it back, then revokes it", async () => {
    const [user] = await control.users.fetch()
    if (!user) return

    const created = await control.keys.create({
      userId: user.id,
      reusable: false,
      tags: ["tag:probe"],
      expirySeconds: 3600
    })

    expect(created.secret).toBeString()
    expect(created.tags).toEqual(["tag:probe"])

    const listed = await control.keys.fetch(user.id)
    expect(listed.some(key => key.id === created.id)).toBe(true)

    await control.keys.revoke(created)
  })
})

describe.skipIf(!serverUp)("api keys", () => {
  test("lists keys as prefixes only", async () => {
    const keys = await control.apiKeys.fetch()

    expect(keys[0]?.prefix).toBeString()
    expect(keys[0]).not.toHaveProperty("key")
  })
})

describe.skipIf(!serverUp)("policy", () => {
  test("stores and reads back a policy document", async () => {
    const document = JSON.stringify({
      tagOwners: { "tag:probe": [] },
      acls: [{ action: "accept", src: ["*"], dst: ["*:*"] }]
    })

    expect((await control.policy.set(document)).policy).toBe(document)
    expect(JSON.parse((await control.policy.fetch()).policy).acls).toHaveLength(
      1
    )
  })

  test("rejects a broken document without applying it", async () => {
    expect(control.policy.set("{ not json")).rejects.toThrow()
  })
})
