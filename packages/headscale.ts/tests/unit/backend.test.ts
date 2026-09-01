import { describe, expect, test } from "bun:test"
import { Tailnet } from "tailnet.ts"
import { headscale } from "../../src"

describe("headscale backend", () => {
  test("targets the v1 API under the given url", () => {
    expect(headscale({ url: "http://x:8080/", apiKey: "k" }).http.baseUrl).toBe(
      "http://x:8080/api/v1"
    )
  })

  test("satisfies the shared contract and can rename", () => {
    const control = new Tailnet(headscale({ url: "http://x", apiKey: "k" }))

    expect(control.name).toBe("headscale")
    expect(control.canRename).toBe(true)
    expect(control.backend.apiKeys.fetch).toBeFunction()
  })

  test("refuses to list keys without a user, which Headscale requires", () => {
    const backend = headscale({ url: "http://x", apiKey: "k" })

    expect(backend.keys.fetch()).rejects.toThrow("pass a userId")
  })
})
