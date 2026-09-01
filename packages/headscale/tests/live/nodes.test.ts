import { describe, expect, test } from "bun:test"
import { control, serverUp } from "../harness"

describe.skipIf(!serverUp)("nodes", () => {
  test("maps onto the shared node shape", async () => {
    const nodes = await control.nodes.fetch()
    expect(nodes).toBeInstanceOf(Array)
    if (!nodes[0]) return

    expect(nodes[0].addresses).toBeInstanceOf(Array)
    expect(nodes[0].owner.name).toBeString()
    expect(nodes[0].raw).toBeDefined()
  })

  test("resolves a single node by id", async () => {
    const [first] = await control.nodes.fetch()
    if (!first) return

    expect((await control.nodes.fetch(first.id)).id).toBe(first.id)
  })

  test("filters by user name, not id", async () => {
    const [first] = await control.nodes.fetch()
    if (!first) return

    const owned = await control.nodes.byUser(first.owner.name)
    expect(owned.every(node => node.owner.name === first.owner.name)).toBe(true)

    expect(control.nodes.byUser(first.owner.id)).rejects.toThrow(
      "user not found"
    )
  })

  test("replaces tags wholesale", async () => {
    const [first] = await control.nodes.fetch()
    if (!first) return

    await control.nodes.setTags(first.id, ["tag:probe"])
    expect((await control.nodes.fetch(first.id)).tags).toEqual(["tag:probe"])

    await control.nodes.setTags(first.id, [])
    expect((await control.nodes.fetch(first.id)).tags).toEqual([])
  })

  test("renames and restores", async () => {
    const [first] = await control.nodes.fetch()
    if (!first) return

    await control.nodes.rename?.(first.id, "probe-name")
    expect((await control.nodes.fetch(first.id)).name).toBe("probe-name")

    await control.nodes.rename?.(first.id, first.name)
  })
})
