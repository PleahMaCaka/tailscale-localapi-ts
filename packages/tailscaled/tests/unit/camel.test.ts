import { describe, expect, test } from "bun:test"
import { camelizeKeys, toCamelCase, toPascalCase } from "../../src/camel"

describe("key casing", () => {
  test.each([
    ["BackendState", "backendState"],
    ["TailscaleIPs", "tailscaleIps"],
    ["AllowedIPs", "allowedIps"],
    ["DNSName", "dnsName"],
    ["MagicDNSSuffix", "magicDnsSuffix"],
    ["ExitNodeID", "exitNodeId"],
    ["ExitNodeAllowLANAccess", "exitNodeAllowLanAccess"],
    ["UseSOMark", "useSoMark"],
    ["ProfilePicURL", "profilePicUrl"],
    ["PeerAPIURL", "peerApiUrl"],
    ["IPv4", "ipv4"],
    ["IPv6", "ipv6"],
    ["CanPort80", "canPort80"],
    ["OS", "os"],
    ["ID", "id"]
  ])("%s becomes %s", (input, expected) => {
    expect(toCamelCase(input)).toBe(expected)
  })

  test("round-trips back to a Go-matchable field name", () => {
    expect(toPascalCase(toCamelCase("ExitNodeID"))).toBe("ExitNodeId")
    expect(toPascalCase(toCamelCase("RunSSH"))).toBe("RunSsh")
  })

  test("camelizes nested objects and arrays", () => {
    const input = {
      BackendState: "Running",
      Self: { TailscaleIPs: ["100.64.0.1"], HostName: "box" },
      Peer: [{ DNSName: "a." }, { DNSName: "b." }]
    }

    expect(camelizeKeys(input)).toEqual({
      backendState: "Running",
      self: { tailscaleIps: ["100.64.0.1"], hostName: "box" },
      peer: [{ dnsName: "a." }, { dnsName: "b." }]
    })
  })

  test("leaves primitives and null untouched", () => {
    expect(camelizeKeys(null)).toBeNull()
    expect(camelizeKeys(42)).toBe(42)
    expect(camelizeKeys("Value")).toBe("Value")
  })
})
