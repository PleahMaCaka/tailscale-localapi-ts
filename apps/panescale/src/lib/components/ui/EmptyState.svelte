<script lang="ts">
import Icon from "@iconify/svelte"
import type { Snippet } from "svelte"

let {
  icon,
  title,
  hint,
  action
}: {
  icon: string
  title: string
  hint: string
  action?: Snippet
} = $props()
</script>

<div
  class="flex flex-col items-center gap-3 rounded-box border border-dashed border-base-300 px-6 py-14 text-center"
>
  <Icon {icon} class="size-6 text-base-content/30" />
  <div>
    <p class="font-medium">{title}</p>
    <p class="mt-1 text-sm text-base-content/55">{hint}</p>
  </div>
  {#if action}
    {@render action()}
  {/if}
</div>
