import { describe, expect, test } from "bun:test"
import type { Backend, NodeOps } from "../../src"
import { Tailnet } from "../../src"

function backend(nodes: Partial<NodeOps> = {}): Backend {
  return {
    name: "stub",
    nodes: nodes as NodeOps,
    users: { fetch: async () => [] },
    keys: {
      fetch: async () => [],
      create: async () => {
        throw new Error("not implemented")
      },
      revoke: async () => {}
    },
    policy: {
      fetch: async () => ({ policy: "", updatedAt: null, version: null }),
      set: async policy => ({ policy, updatedAt: null, version: null })
    },
    isReachable: async () => true
  }
}

describe("Tailnet", () => {
  test("exposes the backend's operations directly", () => {
    const stub = backend()
    const control = new Tailnet(stub)

    expect(control.nodes).toBe(stub.nodes)
    expect(control.users).toBe(stub.users)
    expect(control.policy).toBe(stub.policy)
    expect(control.name).toBe("stub")
  })

  test("reports whether the backend can rename", () => {
    expect(new Tailnet(backend()).canRename).toBe(false)
    expect(new Tailnet(backend({ rename: async () => {} })).canRename).toBe(
      true
    )
  })

  test("keeps the concrete backend reachable", async () => {
    const control = new Tailnet(backend())

    expect(await control.isReachable()).toBe(true)
    expect(control.backend.name).toBe("stub")
  })
})
