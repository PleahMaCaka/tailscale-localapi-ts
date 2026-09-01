import { describe, expect, test } from "bun:test"
import type { KeyOps, NodeOps, PolicyOps, UserOps } from "../../src"
import { Tailnet } from "../../src"

class Stub extends Tailnet {
  readonly name = "stub"

  readonly nodes: NodeOps

  readonly users: UserOps = { fetch: async () => [] }

  readonly keys: KeyOps = {
    fetch: async () => [],
    create: async () => {
      throw new Error("not implemented")
    },
    revoke: async () => {}
  }

  readonly policy: PolicyOps = {
    fetch: async () => ({ policy: "", updatedAt: null, version: null }),
    set: async policy => ({ policy, updatedAt: null, version: null })
  }

  constructor(nodes: Partial<NodeOps> = {}) {
    super()
    this.nodes = nodes as NodeOps
  }

  async isReachable() {
    return true
  }
}

describe("Tailnet", () => {
  test("reports whether the control plane can rename", () => {
    expect(new Stub().canRename).toBe(false)
    expect(new Stub({ rename: async () => {} }).canRename).toBe(true)
  })

  test("is the type shared by every control plane", async () => {
    const control: Tailnet = new Stub()

    expect(control.name).toBe("stub")
    expect(await control.isReachable()).toBe(true)
  })
})
