import { fail } from "@sveltejs/kit"
import { attempt } from "$lib/server/actions"
import { requireControl } from "$lib/server/control"
import { toUserViews } from "$lib/tailnet/users"

interface WritableUsers {
  create(options: {
    name: string
    displayName?: string
    email?: string
  }): Promise<unknown>
  rename(id: string, newName: string): Promise<unknown>
  delete(id: string): Promise<void>
}

function writableUsers(): WritableUsers {
  const backend = requireControl().backend
  if (backend.name !== "headscale") {
    throw new Error("Only Headscale manages its own user records")
  }

  return backend.users as unknown as WritableUsers
}

export async function load() {
  const control = requireControl()

  const [users, nodes] = await Promise.all([
    control.users.fetch(),
    control.nodes.fetch()
  ])

  return {
    users: toUserViews(users, nodes),
    editable: control.backend.name === "headscale"
  }
}

export const actions = {
  create: async ({ request }) => {
    const form = await request.formData()
    const name = String(form.get("name") ?? "").trim()
    if (!name) return fail(400, { reason: "A user needs a name" })

    return attempt(() =>
      writableUsers().create({
        name,
        displayName: String(form.get("displayName") ?? "") || undefined,
        email: String(form.get("email") ?? "") || undefined
      })
    )
  },

  rename: async ({ request }) => {
    const form = await request.formData()

    return attempt(() =>
      writableUsers().rename(String(form.get("id")), String(form.get("name")))
    )
  },

  delete: async ({ request }) => {
    const form = await request.formData()

    return attempt(() => writableUsers().delete(String(form.get("id"))))
  }
}
