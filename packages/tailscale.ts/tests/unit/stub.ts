export interface Call {
  url: string
  method: string
  body: string | null
  headers: Record<string, string>
}

export interface Route {
  status?: number
  body?: unknown
  text?: string
  headers?: Record<string, string>
}

/** Replaces global fetch with a table of canned responses, keyed by path. */
export function stubFetch(routes: Record<string, Route>) {
  const calls: Call[] = []
  const original = globalThis.fetch

  globalThis.fetch = (async (
    input: Parameters<typeof fetch>[0],
    init?: RequestInit
  ) => {
    const url = String(input)
    const path = url.replace("https://api.tailscale.com/api/v2", "")

    calls.push({
      url: path,
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? init.body : null,
      headers: (init?.headers ?? {}) as Record<string, string>
    })

    const route = routes[`${init?.method ?? "GET"} ${path}`] ?? routes[path]
    if (!route) return new Response("not stubbed", { status: 404 })

    return new Response(route.text ?? JSON.stringify(route.body ?? {}), {
      status: route.status ?? 200,
      headers: route.headers
    })
  }) as typeof fetch

  function restore() {
    globalThis.fetch = original
  }

  return { calls, restore }
}
