import { attempt, toList } from "$lib/server/actions"
import { requireControl } from "$lib/server/control"
import { toMachineViews } from "$lib/tailnet/machines"
import { toUserViews } from "$lib/tailnet/users"

export async function load() {
  const control = requireControl()

  const [nodes, users] = await Promise.all([
    control.nodes.fetch(),
    control.users.fetch()
  ])

  return {
    machines: toMachineViews(nodes),
    users: toUserViews(users, nodes),
    canMoveOwner: control.backend.name === "headscale"
  }
}

export const actions = {
  rename: async ({ request }) => {
    const form = await request.formData()
    const control = requireControl()

    return attempt(async () => {
      if (!control.nodes.rename) throw new Error("This backend cannot rename")

      await control.nodes.rename(
        String(form.get("id")),
        String(form.get("name"))
      )
    })
  },

  setTags: async ({ request }) => {
    const form = await request.formData()

    return attempt(() =>
      requireControl().nodes.setTags(
        String(form.get("id")),
        toList(form.get("tags"))
      )
    )
  },

  setRoutes: async ({ request }) => {
    const form = await request.formData()

    return attempt(() =>
      requireControl().nodes.setRoutes(
        String(form.get("id")),
        toList(form.get("routes"))
      )
    )
  },

  moveToUser: async ({ request }) => {
    const form = await request.formData()
    const backend = requireControl().backend

    return attempt(async () => {
      if (backend.name !== "headscale") {
        throw new Error("Only Headscale can move a node between users")
      }

      const nodes = backend.nodes as unknown as {
        moveToUser(id: string, userId: string): Promise<unknown>
      }
      await nodes.moveToUser(String(form.get("id")), String(form.get("userId")))
    })
  },

  expire: async ({ request }) => {
    const form = await request.formData()

    return attempt(() => requireControl().nodes.expire(String(form.get("id"))))
  },

  delete: async ({ request }) => {
    const form = await request.formData()

    return attempt(() => requireControl().nodes.delete(String(form.get("id"))))
  }
}
