import { jsonInit, type Transport } from "../transport"
import type { LoginProfile, ProfileStatus } from "../types"

/** Manages the login profiles stored on this machine. */
export class ProfileManager {
  constructor(private readonly transport: Transport) {}

  /** Lists every profile saved on this machine. */
  fetch(): Promise<LoginProfile[]> {
    return this.transport.json<LoginProfile[]>("profiles/")
  }

  /** Returns the active profile, or `null` when nothing is logged in. */
  async current(): Promise<LoginProfile | null> {
    try {
      return await this.transport.json<LoginProfile>("profiles/current")
    } catch {
      return null
    }
  }

  /** Returns the active profile and the full list in one call. */
  async status(): Promise<ProfileStatus> {
    const [current, profiles] = await Promise.all([
      this.current(),
      this.fetch().catch(() => [])
    ])

    return { current, profiles }
  }

  /**
   * Creates an empty profile and makes it active.
   *
   * @remarks
   * Risk: **write**. The previous profile is kept but stops being the active
   * one, so this machine leaves its current tailnet until you log in again.
   */
  create(): Promise<void> {
    return this.transport.send("profiles/", jsonInit("PUT"))
  }

  /**
   * Switches to an existing profile.
   *
   * @remarks
   * Risk: **write**. Reconnects the daemon to whatever tailnet that profile
   * belongs to.
   */
  switch(profileId: string): Promise<void> {
    return this.transport.send(
      `profiles/${encodeURIComponent(profileId)}`,
      jsonInit("POST")
    )
  }

  /**
   * Deletes a saved profile and its keys.
   *
   * @remarks
   * Risk: **danger**. Irreversible. Deleting the active profile logs this
   * machine out of its tailnet.
   */
  delete(profileId: string): Promise<void> {
    return this.transport.send(
      `profiles/${encodeURIComponent(profileId)}`,
      jsonInit("DELETE")
    )
  }
}
