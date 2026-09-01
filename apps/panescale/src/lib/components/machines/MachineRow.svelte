<script lang="ts">
import Icon from "@iconify/svelte"
import RowMenu from "$lib/components/ui/RowMenu.svelte"
import Tag from "$lib/components/ui/Tag.svelte"
import type { MachineView } from "$lib/tailnet/machines"
import AddressSlot from "./AddressSlot.svelte"
import type { MachineField } from "./MachineDialog.svelte"

let {
  machine,
  canRename,
  canMoveOwner,
  onopen
}: {
  machine: MachineView
  canRename: boolean
  canMoveOwner: boolean
  onopen: (machine: MachineView, field: MachineField) => void
} = $props()

const osIcon: Record<string, string> = {
  linux: "lucide:terminal",
  windows: "lucide:app-window",
  macOS: "lucide:command",
  iOS: "lucide:smartphone",
  android: "lucide:smartphone"
}
</script>

<div
  class="flex items-center gap-3 border-b border-base-300 transition-colors last:border-b-0 hover:bg-base-200"
>
  <button
    type="button"
    onclick={() => onopen(machine, "overview")}
    class="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left"
  >
    <AddressSlot addresses={machine.addresses} online={machine.online} />

    <span class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="flex items-center gap-2">
        <span class="truncate text-sm font-medium">{machine.name}</span>
        {#if machine.expired}
          <span
            class="rounded-selector bg-error/15 px-1.5 py-0.5 text-[0.625rem] font-medium text-error"
          >
            key expired
          </span>
        {/if}
        {#if machine.pendingRoutes.length}
          <span
            class="rounded-selector bg-warning/15 px-1.5 py-0.5 text-[0.625rem] font-medium text-warning"
          >
            {machine.pendingRoutes.length} route{machine.pendingRoutes.length === 1
              ? ""
              : "s"} waiting
          </span>
        {/if}
      </span>
      <span class="truncate text-[0.6875rem] text-base-content/40">
        {machine.fqdn || machine.owner.name}
      </span>
    </span>

    <span class="hidden max-w-56 flex-wrap items-center gap-1 lg:flex">
      {#each machine.tags.slice(0, 3) as tag (tag)}
        <Tag {tag} />
      {/each}
      {#if machine.tags.length > 3}
        <span class="text-[0.6875rem] text-base-content/40">
          +{machine.tags.length - 3}
        </span>
      {/if}
    </span>

    <span class="hidden w-32 shrink-0 truncate text-xs text-base-content/50 md:block">
      {machine.owner.name}
    </span>

    <span class="hidden w-28 shrink-0 text-xs text-base-content/50 sm:block">
      {machine.lastSeen}
    </span>

    <span class="flex w-6 shrink-0 items-center justify-center text-base-content/30">
      {#if machine.os}
        <Icon
          icon={osIcon[machine.os] ?? "lucide:circle-question-mark"}
          class="size-4"
        />
      {/if}
    </span>
  </button>

  <span class="pr-2">
    <RowMenu label="Actions for {machine.name}">
      <li>
        <button type="button" onclick={() => onopen(machine, "overview")}>
          Open details
        </button>
      </li>
      {#if canRename}
        <li>
          <button type="button" onclick={() => onopen(machine, "name")}>Rename</button>
        </li>
      {/if}
      <li>
        <button type="button" onclick={() => onopen(machine, "tags")}>Edit tags</button>
      </li>
      <li>
        <button type="button" onclick={() => onopen(machine, "routes")}>
          Edit routes
        </button>
      </li>
      {#if canMoveOwner}
        <li>
          <button type="button" onclick={() => onopen(machine, "owner")}>
            Change owner
          </button>
        </li>
      {/if}
    </RowMenu>
  </span>
</div>
