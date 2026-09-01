<script lang="ts">
import Icon from "@iconify/svelte"
import { untrack } from "svelte"
import { enhance } from "$app/forms"

let {
  policy,
  updatedAt,
  version,
  editable
}: {
  policy: string
  updatedAt: string
  version: string
  editable: boolean
} = $props()

let draft = $state(untrack(() => policy))

const dirty = $derived(draft !== policy)

const lines = $derived(draft.split("\n"))

const saved = $derived(
  updatedAt ? new Date(updatedAt).toLocaleString() : "not saved yet"
)
</script>

<section class="overflow-hidden rounded-box border border-base-300 bg-base-100">
  <form method="POST" action="?/save" use:enhance>
    <input type="hidden" name="version" value={version} />

    <div class="flex max-h-[32rem] overflow-auto">
      <ol
        aria-hidden="true"
        class="shrink-0 select-none border-r border-base-300 bg-base-200 px-3 py-4 text-right text-xs leading-6 text-base-content/25"
      >
        {#each lines as _, index (index)}
          <li>{index + 1}</li>
        {/each}
      </ol>

      <textarea
        name="policy"
        bind:value={draft}
        spellcheck="false"
        readonly={!editable}
        rows={Math.max(lines.length, 16)}
        class="w-full resize-none border-0 bg-transparent px-4 py-4 text-xs leading-6 focus:outline-none"
        aria-label="Access control policy"
      ></textarea>
    </div>

    <footer
      class="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 bg-base-200/60 px-4 py-3"
    >
      <p class="flex items-center gap-2 text-xs text-base-content/50">
        {#if dirty}
          <Icon icon="lucide:dot" class="size-4 text-warning" />
          <span class="text-warning">Unsaved changes</span>
        {:else}
          <Icon icon="lucide:check" class="size-3.5" />
          <span>Saved {saved}</span>
        {/if}
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          disabled={!dirty}
          onclick={() => (draft = policy)}
        >
          Discard changes
        </button>
        <button class="btn btn-error btn-sm" disabled={!dirty || !editable}>
          Save policy
        </button>
      </div>
    </footer>
  </form>
</section>

<p class="text-xs text-base-content/45">
  The server checks the document before storing it, so a broken policy is refused
  rather than applied. A valid but wrong one is not.
</p>
