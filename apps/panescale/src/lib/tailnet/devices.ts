import type { Device, Status } from "tailscaled.ts"
import { shortName, timeAgo } from "./format"

export interface DeviceView {
  id: string
  name: string
  dnsName: string
  os: string
  addresses: string[]
  tags: string[]
  online: boolean
  isSelf: boolean
  isExitNode: boolean
  offersExitNode: boolean
  relay: string
  lastSeen: string
  rxBytes: number
  txBytes: number
}

function toView(device: Device, now: number): DeviceView {
  return {
    id: device.id,
    name: shortName(device.dnsName, device.hostName),
    dnsName: device.dnsName,
    os: device.os || "unknown",
    addresses: device.tailscaleIps ?? [],
    tags: device.tags ?? [],
    online: device.online,
    isSelf: device.isSelf ?? false,
    isExitNode: device.exitNode,
    offersExitNode: device.exitNodeOption,
    relay: device.relay || "direct",
    lastSeen: device.online ? "now" : timeAgo(device.lastSeen, now),
    rxBytes: device.rxBytes,
    txBytes: device.txBytes
  }
}

export function toDeviceViews(status: Status, now = Date.now()): DeviceView[] {
  const self = toView({ ...status.self, isSelf: true }, now)
  const peers = Object.values(status.peer ?? {})
    .map(peer => toView(peer, now))
    .sort(
      (a, b) =>
        Number(b.online) - Number(a.online) || a.name.localeCompare(b.name)
    )

  return [self, ...peers]
}
