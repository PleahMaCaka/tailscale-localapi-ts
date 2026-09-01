<script lang="ts">
import type { Snippet } from "svelte"

let {
  title,
  count = "",
  action
}: {
  title: string
  count?: string
  action?: Snippet
} = $props()
</script>

<header class="flex flex-wrap items-end justify-between gap-3">
  <div>
    <h1 class="text-xl font-semibold tracking-tight">{title}</h1>
    {#if count}
      <p class="mt-0.5 text-sm text-base-content/55">{count}</p>
    {/if}
  </div>
  {#if action}
    <div class="flex items-center gap-2">{@render action()}</div>
  {/if}
</header>
