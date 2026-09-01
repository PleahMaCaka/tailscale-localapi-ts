import { afterEach, describe, expect, test } from "bun:test"
import {
  ConflictError,
  Http,
  InvalidRequestError,
  NotFoundError,
  UnauthorizedError
} from "../../src"

const realFetch = globalThis.fetch

function stub(
  status: number,
  body: string,
  headers: Record<string, string> = {}
) {
  globalThis.fetch = (async () =>
    new Response(body, { status, headers })) as unknown as typeof fetch
}

afterEach(() => {
  globalThis.fetch = realFetch
})

describe("Http", () => {
  test("rejects missing credentials", () => {
    expect(() => new Http({ baseUrl: "", apiKey: "k" })).toThrow("base url")
    expect(() => new Http({ baseUrl: "http://x", apiKey: "" })).toThrow(
      "api key"
    )
  })

  test("trims trailing slashes off the base url", () => {
    expect(new Http({ baseUrl: "http://x:8080///", apiKey: "k" }).baseUrl).toBe(
      "http://x:8080"
    )
  })

  test.each([
    [401, UnauthorizedError],
    [403, UnauthorizedError],
    [404, NotFoundError],
    [400, InvalidRequestError],
    [409, ConflictError],
    [412, ConflictError]
  ])("maps HTTP %i onto a typed error", async (status, expected) => {
    stub(status, JSON.stringify({ message: "nope" }))
    const http = new Http({
      baseUrl: "http://x",
      apiKey: "k",
      readErrorMessage: body => (body as { message: string }).message
    })

    expect(http.json("/thing")).rejects.toBeInstanceOf(expected)
  })

  test("carries the server's message through", async () => {
    stub(500, JSON.stringify({ message: "user not empty" }))
    const http = new Http({
      baseUrl: "http://x",
      apiKey: "k",
      readErrorMessage: body => (body as { message: string }).message
    })

    expect(http.json("/thing")).rejects.toThrow("user not empty")
  })

  test("returns raw text when asked, with headers", async () => {
    stub(200, "{ // hujson\n}", { etag: '"abc"' })
    const http = new Http({ baseUrl: "http://x", apiKey: "k" })

    const response = await http.request<string>("/acl", { asText: true })

    expect(response.data).toContain("hujson")
    expect(response.headers.get("etag")).toBe('"abc"')
  })

  test("treats an empty body as an empty object", async () => {
    stub(200, "")

    expect(
      await new Http({ baseUrl: "http://x", apiKey: "k" }).json<object>("/x")
    ).toEqual({})
  })
})
