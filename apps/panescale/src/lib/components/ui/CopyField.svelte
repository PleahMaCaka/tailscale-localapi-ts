<script lang="ts">
import Icon from "@iconify/svelte"
import { untrack } from "svelte"

let {
  value,
  label = "",
  reveal = true
}: {
  value: string
  label?: string
  reveal?: boolean
} = $props()

let copied = $state(false)
let shown = $state(untrack(() => reveal))

async function copy() {
  await navigator.clipboard.writeText(value)
  copied = true
  setTimeout(() => {
    copied = false
  }, 1600)
}
</script>

<div class="flex flex-col gap-1">
  {#if label}
    <span class="eyebrow">{label}</span>
  {/if}
  <div
    class="flex items-center gap-2 rounded-field border border-base-300 bg-base-200 px-2 py-1.5"
  >
    <code class="min-w-0 flex-1 truncate text-xs">
      {shown ? value : "•".repeat(Math.min(value.length, 40))}
    </code>
    {#if !reveal}
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        onclick={() => (shown = !shown)}
        aria-label={shown ? "Hide value" : "Show value"}
      >
        <Icon icon={shown ? "lucide:eye-off" : "lucide:eye"} class="size-3.5" />
      </button>
    {/if}
    <button type="button" class="btn btn-ghost btn-xs gap-1" onclick={copy}>
      <Icon icon={copied ? "lucide:check" : "lucide:copy"} class="size-3.5" />
      {copied ? "Copied" : "Copy"}
    </button>
  </div>
</div>
