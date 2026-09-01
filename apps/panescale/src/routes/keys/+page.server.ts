import { fail } from "@sveltejs/kit"
import { TailnetError } from "tailnet.ts"
import { attempt, toList } from "$lib/server/actions"
import { requireControl } from "$lib/server/control"

interface HeadscaleApiKeys {
  fetch(): Promise<
    {
      id: string
      prefix: string
      expiration: string
      createdAt: string
      lastSeen: string | null
    }[]
  >
  create(expiration?: string): Promise<string>
  expire(prefix: string): Promise<void>
}

function apiKeys(): HeadscaleApiKeys | null {
  const backend = requireControl().backend
  if (backend.name !== "headscale") return null

  return (backend as unknown as { apiKeys: HeadscaleApiKeys }).apiKeys
}

function isoInDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString()
}

export async function load() {
  const control = requireControl()
  const perUser = control.backend.name === "headscale"
  const users = await control.users.fetch()

  const keysByUser = perUser
    ? await Promise.all(
        users.map(async user => ({
          user: { id: user.id, name: user.name },
          keys: await control.keys.fetch(user.id).catch(() => [])
        }))
      )
    : [
        {
          user: { id: "", name: "tailnet" },
          keys: await control.keys.fetch().catch(() => [])
        }
      ]

  return {
    perUser,
    users: users.map(user => ({ id: user.id, name: user.name })),
    keysByUser: keysByUser.map(group => ({
      user: group.user,
      keys: group.keys.map(key => ({
        id: key.id,
        preview: key.secret ? `${key.secret.slice(0, 12)}…` : key.id,
        reusable: key.reusable,
        ephemeral: key.ephemeral,
        used: key.used,
        tags: key.tags,
        expires: key.expires
      }))
    })),
    apiKeys:
      (await apiKeys()
        ?.fetch()
        .catch(() => [])) ?? []
  }
}

export const actions = {
  createAuthKey: async ({ request }) => {
    const form = await request.formData()
    const days = Number(form.get("days") ?? 1)

    try {
      const created = await requireControl().keys.create({
        userId: String(form.get("user") ?? "") || undefined,
        reusable: form.has("reusable"),
        ephemeral: form.has("ephemeral"),
        expirySeconds: (Number.isFinite(days) ? days : 1) * 86_400,
        tags: toList(form.get("tags"))
      })

      return { issuedKey: created.secret ?? "" }
    } catch (error) {
      const reason =
        error instanceof TailnetError ? error.message : "Could not issue a key"

      return fail(500, { reason })
    }
  },

  revokeAuthKey: async ({ request }) => {
    const form = await request.formData()
    const userId = String(form.get("user") ?? "")
    const id = String(form.get("id"))
    const control = requireControl()

    return attempt(async () => {
      const keys = await control.keys.fetch(userId || undefined)
      const key = keys.find(candidate => candidate.id === id)
      if (!key) throw new Error("That key no longer exists")

      await control.keys.revoke(key)
    })
  },

  createApiKey: async ({ request }) => {
    const days = Number((await request.formData()).get("days") ?? 90)

    try {
      const keys = apiKeys()
      if (!keys) return fail(400, { reason: "This backend has no API keys" })

      return {
        issuedKey: await keys.create(
          isoInDays(Number.isFinite(days) ? days : 90)
        )
      }
    } catch (error) {
      const reason =
        error instanceof TailnetError ? error.message : "Could not issue a key"

      return fail(500, { reason })
    }
  },

  expireApiKey: async ({ request }) => {
    const prefix = String((await request.formData()).get("prefix"))

    return attempt(async () => {
      const keys = apiKeys()
      if (!keys) throw new Error("This backend has no API keys")

      await keys.expire(prefix)
    })
  }
}
