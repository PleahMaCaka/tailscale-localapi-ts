import type { Prefs } from "tailscaled.ts"

export interface PrefToggle {
  field: "routeAll" | "runSsh" | "shieldsUp" | "exitNodeAllowLanAccess"
  label: string
  hint: string
}

export const PREF_TOGGLES: PrefToggle[] = [
  {
    field: "routeAll",
    label: "Accept routes",
    hint: "Use subnet routes advertised by other nodes"
  },
  {
    field: "runSsh",
    label: "Tailscale SSH",
    hint: "Let tailnet peers open an SSH session on this node"
  },
  {
    field: "shieldsUp",
    label: "Shields up",
    hint: "Block all incoming connections from the tailnet"
  },
  {
    field: "exitNodeAllowLanAccess",
    label: "Allow LAN while exiting",
    hint: "Keep local network reachable when an exit node is in use"
  }
]

export function toggleValues(prefs: Prefs) {
  return Object.fromEntries(
    PREF_TOGGLES.map(toggle => [toggle.field, prefs[toggle.field]])
  ) as Record<PrefToggle["field"], boolean>
}
