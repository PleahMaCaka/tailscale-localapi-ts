<script lang="ts">
import type { Snippet } from "svelte"

let {
  title,
  hint = "",
  tone = "plain",
  children,
  action
}: {
  title: string
  hint?: string
  tone?: "plain" | "breaking"
  children: Snippet
  action?: Snippet
} = $props()
</script>

<section
  class="rounded-box border bg-base-100"
  class:border-base-300={tone === "plain"}
  class:border-error={tone === "breaking"}
>
  <header
    class="flex flex-wrap items-start justify-between gap-3 border-b border-base-300 px-5 py-4"
  >
    <div>
      <h2 class="text-sm font-semibold" class:text-error={tone === "breaking"}>
        {title}
      </h2>
      {#if hint}
        <p class="mt-0.5 text-sm text-base-content/55">{hint}</p>
      {/if}
    </div>
    {#if action}
      {@render action()}
    {/if}
  </header>

  <div class="flex flex-col gap-4 p-5">
    {@render children()}
  </div>
</section>
