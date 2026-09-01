<script lang="ts">
import Icon from "@iconify/svelte"
import PageHeader from "$lib/components/layout/PageHeader.svelte"
import MachineDialog, {
  type MachineField
} from "$lib/components/machines/MachineDialog.svelte"
import MachineRow from "$lib/components/machines/MachineRow.svelte"
import EmptyState from "$lib/components/ui/EmptyState.svelte"
import type { MachineView } from "$lib/tailnet/machines"

let { data, form } = $props()

let query = $state("")
let filter = $state<"all" | "online" | "offline" | "attention">("all")
let openId = $state<string | null>(null)
let openField = $state<MachineField>("overview")

const selected = $derived(
  data.machines.find(machine => machine.id === openId) ?? null
)

const online = $derived(data.machines.filter(machine => machine.online).length)

const attention = $derived(
  data.machines.filter(
    machine => machine.expired || machine.pendingRoutes.length > 0
  ).length
)

const filters = $derived([
  { key: "all" as const, label: "All", count: data.machines.length },
  { key: "online" as const, label: "Connected", count: online },
  {
    key: "offline" as const,
    label: "Offline",
    count: data.machines.length - online
  },
  { key: "attention" as const, label: "Needs attention", count: attention }
])

const matches = $derived(
  data.machines
    .filter(machine => {
      if (filter === "online") return machine.online
      if (filter === "offline") return !machine.online
      if (filter === "attention") {
        return machine.expired || machine.pendingRoutes.length > 0
      }

      return true
    })
    .filter(machine =>
      [
        machine.name,
        machine.fqdn,
        machine.owner.name,
        ...machine.addresses,
        ...machine.tags
      ]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
    )
)

function open(machine: MachineView, field: MachineField) {
  openId = machine.id
  openField = field
}
</script>

<PageHeader
  title="Machines"
  count="{data.machines.length} registered, {online} connected"
/>

{#if form?.reason}
  <div class="alert alert-error">
    <Icon icon="lucide:circle-x" class="size-4" />
    <span>{form.reason}</span>
  </div>
{/if}

<div class="flex flex-wrap items-center gap-2">
  <label class="input input-sm w-72 max-w-full">
    <Icon icon="lucide:search" class="size-4 opacity-50" />
    <input
      bind:value={query}
      type="search"
      placeholder="Name, address, owner or tag"
      aria-label="Search machines"
    />
  </label>

  <div class="flex flex-wrap gap-1" role="group" aria-label="Filter machines">
    {#each filters as option (option.key)}
      <button
        type="button"
        aria-pressed={filter === option.key}
        onclick={() => (filter = option.key)}
        class="rounded-field border px-2.5 py-1 text-xs transition-colors {filter ===
        option.key
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'border-base-300 text-base-content/60 hover:bg-base-100'}"
      >
        {option.label}
        <span class="ml-1 opacity-60">{option.count}</span>
      </button>
    {/each}
  </div>
</div>

{#if matches.length}
  <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
    {#each matches as machine (machine.id)}
      <MachineRow
        {machine}
        canRename={data.canRename}
        canMoveOwner={data.canMoveOwner}
        onopen={open}
      />
    {/each}
  </div>
{:else if data.machines.length}
  <EmptyState
    icon="lucide:search-x"
    title="Nothing matches"
    hint="No machine matches that search and filter."
  />
{:else}
  <EmptyState
    icon="lucide:server-off"
    title="No machines yet"
    hint="Issue an auth key, then run tailscale up on a machine pointed at this control plane."
  >
    {#snippet action()}
      <a href="/keys" class="btn btn-primary btn-sm">Issue an auth key</a>
    {/snippet}
  </EmptyState>
{/if}

{#if selected}
  <MachineDialog
    machine={selected}
    users={data.users}
    canRename={data.canRename}
    canMoveOwner={data.canMoveOwner}
    bind:field={openField}
    onclose={() => (openId = null)}
  />
{/if}
