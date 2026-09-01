import { describe, expect, test } from "bun:test"
import { Headscale } from "../../src"

describe("Headscale", () => {
  test("targets the v1 API under the given url", () => {
    expect(
      new Headscale({ url: "http://x:8080/", apiKey: "k" }).http.baseUrl
    ).toBe("http://x:8080/api/v1")
  })

  test("can rename and manage API keys", () => {
    const control = new Headscale({ url: "http://x", apiKey: "k" })

    expect(control.name).toBe("headscale")
    expect(control.canRename).toBe(true)
    expect(control.apiKeys.fetch).toBeFunction()
  })

  test("refuses to list keys without a user, which Headscale requires", () => {
    const control = new Headscale({ url: "http://x", apiKey: "k" })

    expect(control.keys.fetch()).rejects.toThrow("pass a userId")
  })
})
