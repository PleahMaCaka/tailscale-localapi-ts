import { afterAll, describe, expect, test } from "bun:test"
import { backend, control, serverUp } from "../harness"

const probe = `probe-${process.pid}`

describe.skipIf(!serverUp)("users", () => {
  afterAll(async () => {
    for (const name of [probe, `${probe}-x`]) {
      const existing = await backend.users.byName(name)
      if (existing) await backend.users.delete(existing.id)
    }
  })

  test("lists users through the shared shape", async () => {
    const users = await control.users.fetch()

    expect(users).toBeInstanceOf(Array)
    expect(users[0]?.name).toBeString()
  })

  test("creates, resolves and renames", async () => {
    const created = await backend.users.create({ name: probe })
    expect(created.name).toBe(probe)

    expect((await backend.users.byId(created.id))?.id).toBe(created.id)

    const renamed = await backend.users.rename(created.id, `${probe}-x`)
    expect(renamed.name).toBe(`${probe}-x`)
  })

  test("returns null for an unknown name", async () => {
    expect(await backend.users.byName("no-such-user-here")).toBeNull()
  })
})
