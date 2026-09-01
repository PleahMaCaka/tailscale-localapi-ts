import { fail } from "@sveltejs/kit"
import { TailnetError } from "tailnet.ts"
import { toList } from "$lib/server/actions"
import { requireControl } from "$lib/server/control"
import { readDnsSettings, writeDnsSettings } from "$lib/server/headscaleConfig"

interface TailscaleDns {
  nameservers(): Promise<string[]>
  setNameservers(nameservers: string[]): Promise<string[]>
  preferences(): Promise<{ magicDNS: boolean }>
  setPreferences(preferences: { magicDNS: boolean }): Promise<unknown>
  searchPaths(): Promise<string[]>
  setSearchPaths(paths: string[]): Promise<string[]>
}

function tailscaleDns(): TailscaleDns | null {
  const backend = requireControl().backend
  if (backend.name !== "tailscale") return null

  return (backend as unknown as { dns: TailscaleDns }).dns
}

export async function load() {
  const dns = tailscaleDns()

  if (dns) {
    const [nameservers, preferences, searchDomains] = await Promise.all([
      dns.nameservers(),
      dns.preferences(),
      dns.searchPaths()
    ])

    return {
      source: "api" as const,
      dns: {
        baseDomain: "",
        magicDns: preferences.magicDNS,
        override: false,
        globalNameservers: nameservers,
        searchDomains,
        path: null,
        writable: true
      },
      reason: ""
    }
  }

  try {
    return {
      source: "config" as const,
      dns: await readDnsSettings(),
      reason: ""
    }
  } catch (error) {
    return {
      source: "config" as const,
      dns: null,
      reason: error instanceof Error ? error.message : String(error)
    }
  }
}

export const actions = {
  save: async ({ request }) => {
    const form = await request.formData()
    const nameservers = toList(form.get("nameservers"))
    const searchDomains = toList(form.get("searchDomains"))
    const magicDns = form.has("magicDns")

    try {
      const dns = tailscaleDns()

      if (dns) {
        await dns.setNameservers(nameservers)
        await dns.setPreferences({ magicDNS: magicDns })
        await dns.setSearchPaths(searchDomains)

        return { success: true, restartNeeded: false }
      }

      await writeDnsSettings({
        baseDomain: String(form.get("baseDomain") ?? "").trim(),
        magicDns,
        override: form.has("override"),
        globalNameservers: nameservers,
        searchDomains
      })

      return { success: true, restartNeeded: true }
    } catch (error) {
      const reason =
        error instanceof TailnetError || error instanceof Error
          ? error.message
          : "Could not save DNS settings"

      return fail(500, { reason })
    }
  }
}
