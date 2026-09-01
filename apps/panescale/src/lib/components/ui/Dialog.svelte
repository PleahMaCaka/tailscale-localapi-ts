<script lang="ts">
import Icon from "@iconify/svelte"
import type { Snippet } from "svelte"

let {
  open = false,
  title,
  description = "",
  tone = "plain",
  size = "md",
  onclose,
  children,
  footer
}: {
  open?: boolean
  title: string
  description?: string
  tone?: "plain" | "danger"
  size?: "md" | "lg"
  onclose?: () => void
  children: Snippet
  footer?: Snippet
} = $props()

let dialog = $state<HTMLDialogElement>()

$effect(() => {
  if (!dialog) return
  if (open && !dialog.open) dialog.showModal()
  if (!open && dialog.open) dialog.close()
})
</script>

<dialog bind:this={dialog} class="modal" onclose={onclose} aria-label={title}>
  <div
    class="modal-box border bg-base-100 p-0"
    class:max-w-xl={size === "md"}
    class:max-w-2xl={size === "lg"}
    class:border-base-300={tone === "plain"}
    class:border-error={tone === "danger"}
  >
    <header
      class="flex items-start justify-between gap-4 border-b border-base-300 p-5"
    >
      <div class="min-w-0">
        <h2
          class="truncate text-base font-semibold tracking-tight"
          class:text-error={tone === "danger"}
        >
          {title}
        </h2>
        {#if description}
          <p class="mt-1 truncate text-sm text-base-content/60">{description}</p>
        {/if}
      </div>
      <button
        type="button"
        class="btn btn-ghost btn-sm btn-square"
        onclick={onclose}
        aria-label="Close"
      >
        <Icon icon="lucide:x" class="size-4" />
      </button>
    </header>

    <div class="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-5">
      {@render children()}
    </div>

    {#if footer}
      <footer
        class="flex flex-wrap items-center gap-2 border-t border-base-300 bg-base-200/60 p-4"
      >
        {@render footer()}
      </footer>
    {/if}
  </div>

  <button
    type="button"
    class="modal-backdrop cursor-default"
    onclick={onclose}
    aria-label="Close"
  ></button>
</dialog>
