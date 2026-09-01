import type { TailnetNode } from "tailnet.ts"
import { timeAgo } from "./format"

export interface MachineView {
  id: string
  name: string
  fqdn: string
  owner: { id: string; name: string }
  addresses: string[]
  tags: string[]
  online: boolean
  lastSeen: string
  expires: string
  expired: boolean
  neverExpires: boolean
  os: string
  clientVersion: string
  advertisedRoutes: string[]
  enabledRoutes: string[]
  pendingRoutes: string[]
}

export function toMachineView(
  node: TailnetNode,
  now = Date.now()
): MachineView {
  const enabled = new Set(node.enabledRoutes)
  const expired = node.expires !== null && Date.parse(node.expires) <= now

  return {
    id: node.id,
    name: node.name,
    fqdn: node.fqdn,
    owner: node.owner,
    addresses: node.addresses,
    tags: node.tags,
    online: node.online,
    lastSeen: node.online
      ? "connected"
      : timeAgo(node.lastSeen ?? undefined, now),
    expires: node.expires === null ? "no expiry" : timeAgo(node.expires, now),
    expired,
    neverExpires: node.expires === null,
    os: node.os,
    clientVersion: node.clientVersion,
    advertisedRoutes: node.advertisedRoutes,
    enabledRoutes: node.enabledRoutes,
    pendingRoutes: node.advertisedRoutes.filter(route => !enabled.has(route))
  }
}

export function toMachineViews(
  nodes: TailnetNode[],
  now = Date.now()
): MachineView[] {
  return nodes
    .map(node => toMachineView(node, now))
    .sort((a, b) => a.name.localeCompare(b.name))
}
