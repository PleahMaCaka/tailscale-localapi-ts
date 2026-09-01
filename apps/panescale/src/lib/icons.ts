import { addCollection } from "@iconify/svelte"
import icons from "./icons.json"

/**
 * Registers the icons this app uses.
 *
 * Without this @iconify/svelte fetches every icon from api.iconify.design at
 * runtime, so a control plane on an isolated network renders none of them.
 * Regenerate the subset with `bun run icons` after adding an icon.
 */
export function registerIcons() {
  addCollection(icons)
}
