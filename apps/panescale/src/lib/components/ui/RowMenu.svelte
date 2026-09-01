<script lang="ts">
import Icon from "@iconify/svelte"
import type { Snippet } from "svelte"

let {
  children,
  label = "More actions"
}: { children: Snippet; label?: string } = $props()
</script>

<details class="dropdown dropdown-end">
  <summary class="btn btn-ghost btn-sm btn-square" aria-label={label}>
    <Icon icon="lucide:ellipsis" class="size-4" />
  </summary>
  <ul
    class="dropdown-content menu z-10 w-48 rounded-box border border-base-300 bg-base-100 p-1 text-sm shadow-lg"
  >
    {@render children()}
  </ul>
</details>
