<script lang="ts">
import { enhance } from "$app/forms"
import ConfirmButton from "$lib/components/ui/ConfirmButton.svelte"
import CopyField from "$lib/components/ui/CopyField.svelte"
import Dialog from "$lib/components/ui/Dialog.svelte"
import Tag from "$lib/components/ui/Tag.svelte"
import type { MachineView } from "$lib/tailnet/machines"
import type { UserView } from "$lib/tailnet/users"
import AddressSlot from "./AddressSlot.svelte"

export type MachineField = "overview" | "name" | "tags" | "routes" | "owner"

let {
  machine,
  users,
  canRename,
  canMoveOwner,
  field = $bindable("overview"),
  onclose
}: {
  machine: MachineView
  users: UserView[]
  canRename: boolean
  canMoveOwner: boolean
  field?: MachineField
  onclose: () => void
} = $props()

function afterSubmit() {
  return async ({ update }: { update: () => Promise<void> }) => {
    field = "overview"
    await update()
  }
}
</script>

<Dialog
  open
  size="lg"
  {onclose}
  title={machine.name}
  description={machine.fqdn || machine.owner.name}
>
  <div class="flex items-center gap-3">
    <AddressSlot addresses={machine.addresses} online={machine.online} size="large" />
    <dl class="flex flex-1 flex-wrap gap-x-6 gap-y-2">
      <div>
        <dt class="eyebrow">Status</dt>
        <dd class="text-sm">{machine.lastSeen}</dd>
      </div>
      <div>
        <dt class="eyebrow">Key expiry</dt>
        <dd class="text-sm" class:text-error={machine.expired}>{machine.expires}</dd>
      </div>
      <div>
        <dt class="eyebrow">Owner</dt>
        <dd class="text-sm">{machine.owner.name}</dd>
      </div>
      {#if machine.os}
        <div>
          <dt class="eyebrow">Client</dt>
          <dd class="text-sm">{machine.os} {machine.clientVersion}</dd>
        </div>
      {/if}
    </dl>
  </div>

  <div class="flex flex-col gap-1.5">
    <span class="eyebrow">Addresses</span>
    {#each machine.addresses as address (address)}
      <CopyField value={address} />
    {/each}
  </div>

  <div>
    <div class="flex items-center justify-between">
      <span class="eyebrow">Tags</span>
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        onclick={() => (field = field === "tags" ? "overview" : "tags")}
      >
        {field === "tags" ? "Cancel" : "Edit"}
      </button>
    </div>

    {#if field === "tags"}
      <form
        method="POST"
        action="?/setTags"
        use:enhance={afterSubmit}
        class="mt-1.5 flex gap-2"
      >
        <input type="hidden" name="id" value={machine.id} />
        <input
          name="tags"
          value={machine.tags.join(", ")}
          placeholder="tag:server, tag:edge"
          class="input input-sm flex-1"
          aria-label="Tags, comma separated"
        />
        <button class="btn btn-warning btn-sm">Save tags</button>
      </form>
      <p class="mt-1.5 text-xs text-base-content/50">
        Replaces every tag. Tags decide which access rules apply to this machine.
      </p>
    {:else if machine.tags.length}
      <div class="mt-1.5 flex flex-wrap gap-1">
        {#each machine.tags as tag (tag)}
          <Tag {tag} />
        {/each}
      </div>
    {:else}
      <p class="mt-1.5 text-sm text-base-content/45">
        No tags. Access rules match this machine by owner.
      </p>
    {/if}
  </div>

  <div>
    <div class="flex items-center justify-between">
      <span class="eyebrow">Subnet routes</span>
      <button
        type="button"
        class="btn btn-ghost btn-xs"
        onclick={() => (field = field === "routes" ? "overview" : "routes")}
      >
        {field === "routes" ? "Cancel" : "Edit"}
      </button>
    </div>

    {#if field === "routes"}
      <form
        method="POST"
        action="?/setRoutes"
        use:enhance={afterSubmit}
        class="mt-1.5 flex gap-2"
      >
        <input type="hidden" name="id" value={machine.id} />
        <input
          name="routes"
          value={machine.enabledRoutes.join(", ")}
          placeholder={machine.advertisedRoutes.join(", ") || "nothing advertised"}
          class="input input-sm flex-1"
          aria-label="Enabled routes, comma separated"
        />
        <button class="btn btn-warning btn-sm">Enable</button>
      </form>
      <p class="mt-1.5 text-xs text-base-content/50">
        Traffic for these subnets reaches the tailnet through this machine.
      </p>
    {:else if machine.advertisedRoutes.length}
      <ul class="mt-1.5 flex flex-col gap-1">
        {#each machine.advertisedRoutes as route (route)}
          <li class="flex items-center justify-between gap-2 text-sm">
            <span>{route}</span>
            {#if machine.enabledRoutes.includes(route)}
              <span class="text-xs text-success">enabled</span>
            {:else}
              <span class="text-xs text-warning">waiting for approval</span>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="mt-1.5 text-sm text-base-content/45">
        This machine advertises no routes. That is set on the machine itself.
      </p>
    {/if}
  </div>

  {#if field === "name" && canRename}
    <form method="POST" action="?/rename" use:enhance={afterSubmit} class="flex flex-col gap-1">
      <span class="eyebrow">New name</span>
      <div class="flex gap-2">
        <input type="hidden" name="id" value={machine.id} />
        <input
          name="name"
          value={machine.name}
          class="input input-sm flex-1"
          aria-label="Machine name"
        />
        <button class="btn btn-warning btn-sm">Rename</button>
      </div>
    </form>
  {/if}

  {#if field === "owner" && canMoveOwner}
    <form
      method="POST"
      action="?/moveToUser"
      use:enhance={afterSubmit}
      class="flex flex-col gap-1"
    >
      <span class="eyebrow">New owner</span>
      <div class="flex gap-2">
        <input type="hidden" name="id" value={machine.id} />
        <select name="userId" class="select select-sm flex-1" aria-label="New owner">
          {#each users as user (user.id)}
            <option value={user.id} selected={user.id === machine.owner.id}>
              {user.name}
            </option>
          {/each}
        </select>
        <button class="btn btn-warning btn-sm">Move machine</button>
      </div>
    </form>
  {/if}

  {#snippet footer()}
    <ConfirmButton
      variant="button"
      action="?/expire"
      label="Expire key"
      confirmLabel="Expire key"
      consequence="{machine.name} drops off the tailnet immediately and cannot rejoin until someone logs in on it again."
      fields={{ id: machine.id }}
    />
    <ConfirmButton
      variant="button"
      action="?/delete"
      label="Delete machine"
      confirmLabel="Delete machine"
      consequence="{machine.name} is removed from the control plane, loses its addresses, and has to register from scratch."
      fields={{ id: machine.id }}
    />
    <span class="flex-1"></span>
    <button type="button" class="btn btn-ghost btn-sm" onclick={onclose}>Close</button>
  {/snippet}
</Dialog>
