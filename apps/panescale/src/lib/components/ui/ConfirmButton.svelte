<script lang="ts">
import { enhance } from "$app/forms"
import Dialog from "./Dialog.svelte"

let {
  action,
  label,
  consequence,
  confirmLabel,
  fields = {},
  variant = "menu"
}: {
  action: string
  label: string
  consequence: string
  confirmLabel: string
  fields?: Record<string, string>
  variant?: "menu" | "button"
} = $props()

let open = $state(false)
</script>

{#if variant === "menu"}
  <button
    type="button"
    class="w-full text-left text-error"
    onclick={() => (open = true)}
  >
    {label}
  </button>
{:else}
  <button
    type="button"
    class="btn btn-outline btn-error btn-sm"
    onclick={() => (open = true)}
  >
    {label}
  </button>
{/if}

<Dialog {open} onclose={() => (open = false)} title={label} tone="danger" description={consequence}>
  <p class="text-sm text-base-content/70">
    This cannot be undone from here.
  </p>

  {#snippet footer()}
    <button type="button" class="btn btn-ghost btn-sm" onclick={() => (open = false)}>
      Cancel
    </button>
    <form
      method="POST"
      {action}
      use:enhance={() => async ({ update }) => {
        open = false
        await update()
      }}
    >
      {#each Object.entries(fields) as [name, value] (name)}
        <input type="hidden" {name} {value} />
      {/each}
      <button class="btn btn-error btn-sm">{confirmLabel}</button>
    </form>
  {/snippet}
</Dialog>
