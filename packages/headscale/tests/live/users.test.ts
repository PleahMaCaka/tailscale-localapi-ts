import { afterAll, describe, expect, test } from "bun:test"
import { control, serverUp } from "../harness"

const probe = `probe-${process.pid}`

describe.skipIf(!serverUp)("users", () => {
  afterAll(async () => {
    for (const name of [probe, `${probe}-x`]) {
      const existing = await control.users.byName(name)
      if (existing) await control.users.delete(existing.id)
    }
  })

  test("lists users through the shared shape", async () => {
    const users = await control.users.fetch()

    expect(users).toBeInstanceOf(Array)
    expect(users[0]?.name).toBeString()
  })

  test("creates, resolves and renames", async () => {
    const created = await control.users.create({ name: probe })
    expect(created.name).toBe(probe)

    expect((await control.users.byId(created.id))?.id).toBe(created.id)

    const renamed = await control.users.rename(created.id, `${probe}-x`)
    expect(renamed.name).toBe(`${probe}-x`)
  })

  test("returns null for an unknown name", async () => {
    expect(await control.users.byName("no-such-user-here")).toBeNull()
  })
})
