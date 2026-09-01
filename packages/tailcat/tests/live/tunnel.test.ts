import { afterAll, describe, expect, test } from "bun:test"
import { Tailcat } from "../../src"

const installed = Bun.which("tailcat") !== null
const tailcat = new Tailcat({ key: "new" })

const echo = Bun.listen<undefined>({
  hostname: "127.0.0.1",
  port: 0,
  socket: {
    data(socket, data) {
      socket.write(data)
    }
  }
})

afterAll(() => echo.stop(true))

describe.skipIf(!installed)("tailcat", () => {
  test("reports a version", async () => {
    expect(await tailcat.version()).not.toBe("")
  })

  test("serves, pings and tunnels to a local port", async () => {
    const server = await tailcat.serve([echo.port], { fullAddress: true })

    try {
      expect(server.address).toStartWith("tc")

      const parsed = await tailcat.parse(server.address)
      expect(parsed.ServerPublic).toStartWith("nodekey:")

      const pongs = await tailcat.ping(server.address)
      expect(pongs.length).toBeGreaterThan(0)

      const tunnel = tailcat.connect(server.address, echo.port)
      const writer = tunnel.writable.getWriter()
      await writer.write(new TextEncoder().encode("meow\n"))

      const reader = tunnel.readable.getReader()
      const { value } = await reader.read()
      expect(new TextDecoder().decode(value)).toBe("meow\n")

      await writer.close()
      tunnel.close()
    } finally {
      server.stop()
    }
  }, 60_000)
})
