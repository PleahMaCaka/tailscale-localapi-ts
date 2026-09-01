import { fail } from "@sveltejs/kit"
import { NotFoundError, TailnetError } from "@tailnet/core"
import { requireControl } from "$lib/server/control"

const STARTER = `{
  "tagOwners": {},
  "acls": [
    { "action": "accept", "src": ["*"], "dst": ["*:*"] }
  ]
}
`

export async function load() {
  try {
    const policy = await requireControl().policy.fetch()

    return {
      policy: policy.policy,
      updatedAt: policy.updatedAt ?? "",
      version: policy.version ?? "",
      available: true,
      reason: ""
    }
  } catch (error) {
    const message =
      error instanceof TailnetError ? error.message : String(error)

    return {
      policy: STARTER,
      updatedAt: "",
      version: "",
      // "not found" only means nothing is stored yet; anything else is a config problem
      available:
        error instanceof NotFoundError || message.includes("not found"),
      reason: message
    }
  }
}

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData()
    const policy = String(form.get("policy") ?? "")
    const version = String(form.get("version") ?? "")

    try {
      const saved = await requireControl().policy.set(
        policy,
        version || undefined
      )

      return { success: true, updatedAt: saved.updatedAt ?? "" }
    } catch (error) {
      const reason =
        error instanceof TailnetError ? error.message : "Could not save policy"

      return fail(400, { reason })
    }
  }
}
