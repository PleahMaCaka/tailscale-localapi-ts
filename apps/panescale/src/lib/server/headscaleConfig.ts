import { constants } from "node:fs"
import { access, readFile, writeFile } from "node:fs/promises"
import { parse, stringify } from "yaml"
import { env } from "$env/dynamic/private"

export interface DnsSettings {
  baseDomain: string
  magicDns: boolean
  globalNameservers: string[]
  searchDomains: string[]
  override: boolean
}

export interface DnsSnapshot extends DnsSettings {
  path: string | null
  writable: boolean
}

interface HeadscaleConfig {
  dns?: {
    base_domain?: string
    magic_dns?: boolean
    override_local_dns?: boolean
    search_domains?: string[]
    nameservers?: { global?: string[] }
  }
}

const EMPTY: DnsSettings = {
  baseDomain: "",
  magicDns: false,
  globalNameservers: [],
  searchDomains: [],
  override: false
}

function configPath(): string | null {
  return env.HEADSCALE_CONFIG_PATH ?? null
}

async function isWritable(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK)

    return true
  } catch {
    return false
  }
}

export async function readDnsSettings(): Promise<DnsSnapshot> {
  const path = configPath()
  if (!path) return { ...EMPTY, path: null, writable: false }

  const config = parse(await readFile(path, "utf8")) as HeadscaleConfig
  const dns = config.dns ?? {}

  return {
    path,
    writable: await isWritable(path),
    baseDomain: dns.base_domain ?? "",
    magicDns: dns.magic_dns ?? false,
    override: dns.override_local_dns ?? false,
    globalNameservers: dns.nameservers?.global ?? [],
    searchDomains: dns.search_domains ?? []
  }
}

/**
 * Rewrites the DNS block of the Headscale config file.
 *
 * Headscale reads this file once at startup, so the server has to be
 * restarted before anything here takes effect.
 */
export async function writeDnsSettings(settings: DnsSettings): Promise<void> {
  const path = configPath()
  if (!path) throw new Error("HEADSCALE_CONFIG_PATH is not set")

  const config = parse(await readFile(path, "utf8")) as HeadscaleConfig
  config.dns = {
    ...config.dns,
    base_domain: settings.baseDomain,
    magic_dns: settings.magicDns,
    override_local_dns: settings.override,
    search_domains: settings.searchDomains,
    nameservers: {
      ...config.dns?.nameservers,
      global: settings.globalNameservers
    }
  }

  await writeFile(path, stringify(config), "utf8")
}
