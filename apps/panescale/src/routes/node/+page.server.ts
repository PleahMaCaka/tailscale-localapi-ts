import { fail } from "@sveltejs/kit"
import { DaemonUnreachableError, TailscaledError } from "@tailnet/tailscaled"
import { daemon } from "$lib/server/tailscaled"
import { toDeviceViews } from "$lib/tailnet/devices"
import { PREF_TOGGLES, toggleValues } from "$lib/tailnet/prefs"

async function run<T>(work: () => Promise<T>) {
  try {
    await work()

    return { success: true }
  } catch (error) {
    const reason =
      error instanceof TailscaledError ? error.message : "Something went wrong"

    return fail(500, { reason })
  }
}

export async function load() {
  try {
    const [status, prefs] = await Promise.all([
      daemon.status(),
      daemon.prefs.fetch()
    ])

    const devices = toDeviceViews(status)

    return {
      daemon: {
        version: status.version,
        backendState: status.backendState,
        tailnet: status.currentTailnet?.name ?? "unknown",
        magicDnsSuffix: status.magicDnsSuffix ?? "disabled",
        health: status.health ?? []
      },
      self: devices[0],
      peerCount: devices.length - 1,
      onlineCount: devices.filter(device => device.online).length,
      toggles: toggleValues(prefs),
      exitNodeId: prefs.exitNodeId,
      exitNodes: devices.filter(device => device.offersExitNode),
      socketPath: daemon.transport.socketPath,
      reachable: true
    }
  } catch (error) {
    const socketPath =
      error instanceof DaemonUnreachableError
        ? error.socketPath
        : daemon.transport.socketPath

    return { reachable: false, socketPath }
  }
}

export const actions = {
  updatePrefs: async ({ request }) => {
    const form = await request.formData()
    const patch = Object.fromEntries(
      PREF_TOGGLES.map(toggle => [toggle.field, form.has(toggle.field)])
    )

    return run(() => daemon.prefs.edit(patch))
  },

  setExitNode: async ({ request }) => {
    const exitNodeId = String(
      (await request.formData()).get("exitNodeId") ?? ""
    )

    return run(() => daemon.prefs.edit({ exitNodeId }))
  },

  logout: async () => run(() => daemon.logout()),

  resetAuth: async () => run(() => daemon.resetAuth())
}
