import { describe, expect, test } from "bun:test"
import { toMaskedPrefs } from "../../src/managers/prefs"

describe("masked prefs", () => {
  test("pairs every field with its Set flag", () => {
    expect(toMaskedPrefs({ routeAll: true, hostname: "box" })).toEqual({
      RouteAll: true,
      RouteAllSet: true,
      Hostname: "box",
      HostnameSet: true
    })
  })

  test("stays empty for an empty patch", () => {
    expect(toMaskedPrefs({})).toEqual({})
  })
})
