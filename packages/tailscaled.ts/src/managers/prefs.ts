import { toPascalCase } from "../camel"
import { jsonInit, type Transport } from "../transport"
import type { Prefs, PrefsPatch } from "../types"

export function toMaskedPrefs(patch: PrefsPatch): Record<string, unknown> {
  const masked: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(patch)) {
    const field = toPascalCase(key)
    // ipn.MaskedPrefs ignores any field without its matching <Field>Set flag
    masked[field] = value
    masked[`${field}Set`] = true
  }

  return masked
}

/** Reads and edits the daemon's `ipn.Prefs`. */
export class PrefsManager {
  constructor(private readonly transport: Transport) {}

  /** Returns the daemon's current preferences. */
  fetch(): Promise<Prefs> {
    return this.transport.json<Prefs>("prefs")
  }

  /**
   * Applies a partial preference change and returns the resulting prefs.
   *
   * Only the fields present in `patch` are touched. The mask the daemon
   * requires is built for you, so a plain object is enough.
   *
   * @remarks
   * Risk: **write**. Takes effect on the running daemon immediately.
   * Turning on `shieldsUp` or clearing `exitNodeId` changes what this machine
   * can reach.
   */
  edit(patch: PrefsPatch): Promise<Prefs> {
    return this.transport.json<Prefs>(
      "prefs",
      jsonInit("PATCH", toMaskedPrefs(patch))
    )
  }

  /** Asks the daemon whether a set of prefs would be accepted, applying nothing. */
  check(prefs: Prefs): Promise<{ error?: string }> {
    return this.transport.json<{ error?: string }>(
      "check-prefs",
      jsonInit("POST", prefs)
    )
  }
}
