import { describe, expect, test } from "bun:test"
import { firstLine, goDurationToMs, parsePong, rootArgs } from "../../src/cli"

describe("go durations", () => {
  test.each([
    ["42.1ms", 42.1],
    ["1.2ms", 1.2],
    ["1.003s", 1003],
    ["500µs", 0.5],
    ["1m30s", 90_000]
  ])("%s is %d ms", (text, ms) => {
    expect(goDurationToMs(text)).toBeCloseTo(ms, 6)
  })

  test("rejects anything else", () => {
    expect(() => goDurationToMs("soon")).toThrow()
  })
})

describe("pong lines", () => {
  test("reads a relayed pong", () => {
    expect(parsePong("pong in 42.1ms via DERP(sfo)")).toEqual({
      via: "derp",
      relay: "sfo",
      latencyMs: 42.1
    })
  })

  test("reads a direct pong", () => {
    expect(parsePong("pong in 1.2ms via 203.0.113.7:41641")).toEqual({
      via: "direct",
      endpoint: "203.0.113.7:41641",
      latencyMs: 1.2
    })
  })

  test("ignores other output", () => {
    expect(parsePong("# Selected bootstrap relay region 302")).toBeNull()
  })
})

describe("root flags", () => {
  test("stay empty by default", () => {
    expect(rootArgs({})).toEqual([])
  })

  test("carry the key and derp map", () => {
    expect(
      rootArgs({ key: "new", derpMapUrl: "https://x/derpmap.json" })
    ).toEqual(["--key=new", "--derpmap-url=https://x/derpmap.json"])
  })
})

describe("firstLine", () => {
  test("splits off the first line and keeps the rest readable", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"a":1}\nhel'))
        controller.enqueue(new TextEncoder().encode("lo\n"))
        controller.close()
      }
    })

    const { line, rest } = await firstLine(stream)

    expect(line).toBe('{"a":1}')
    expect(await new Response(rest).text()).toBe("hello\n")
  })
})
