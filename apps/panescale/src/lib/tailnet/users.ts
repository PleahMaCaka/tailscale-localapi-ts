import type { TailnetNode, TailnetUser } from "@tailnet/core"

export interface UserView {
  id: string
  name: string
  displayName: string
  createdAt: string
  machineCount: number
}

export function toUserViews(
  users: TailnetUser[],
  nodes: TailnetNode[]
): UserView[] {
  const counts = new Map<string, number>()
  for (const node of nodes) {
    counts.set(node.owner.id, (counts.get(node.owner.id) ?? 0) + 1)
  }

  return users
    .map(user => ({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      createdAt: user.createdAt,
      machineCount: counts.get(user.id) ?? 0
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
