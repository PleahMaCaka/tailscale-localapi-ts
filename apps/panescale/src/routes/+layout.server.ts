import { control, controlStatus } from "$lib/server/control"

export async function load() {
  const status = controlStatus()
  const client = control()

  return {
    kind: status.kind,
    target: status.target,
    connected: client ? await client.isReachable() : false,
    canRename: client?.canRename ?? false
  }
}
