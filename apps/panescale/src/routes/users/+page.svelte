<script lang="ts">
import Icon from "@iconify/svelte"
import { enhance } from "$app/forms"
import PageHeader from "$lib/components/layout/PageHeader.svelte"
import ConfirmButton from "$lib/components/ui/ConfirmButton.svelte"
import Dialog from "$lib/components/ui/Dialog.svelte"
import EmptyState from "$lib/components/ui/EmptyState.svelte"
import RowMenu from "$lib/components/ui/RowMenu.svelte"
import type { UserView } from "$lib/tailnet/users"

let { data, form } = $props()

let adding = $state(false)
let renaming = $state<UserView | null>(null)

const joined = (value: string) =>
  value ? new Date(value).toLocaleDateString() : "unknown"

function afterSubmit(close: () => void) {
  return () =>
    async ({ update }: { update: () => Promise<void> }) => {
      close()
      await update()
    }
}
</script>

<PageHeader title="Users" count="{data.users.length} on this tailnet">
  {#snippet action()}
    {#if data.editable}
      <button class="btn btn-primary btn-sm gap-1.5" onclick={() => (adding = true)}>
        <Icon icon="lucide:user-plus" class="size-4" />
        Add user
      </button>
    {/if}
  {/snippet}
</PageHeader>

{#if form?.reason}
  <div class="alert alert-error">
    <Icon icon="lucide:circle-x" class="size-4" />
    <span>{form.reason}</span>
  </div>
{/if}

{#if !data.editable}
  <p class="text-sm text-base-content/55">
    Tailscale users come from your identity provider, so they are read-only here.
  </p>
{/if}

{#if data.users.length}
  <div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
    {#each data.users as user (user.id)}
      <div
        class="flex items-center gap-4 border-b border-base-300 px-4 py-3 last:border-b-0"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-200 text-xs uppercase"
        >
          {user.name.slice(0, 2)}
        </span>

        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{user.name}</p>
          {#if user.displayName}
            <p class="truncate text-xs text-base-content/45">{user.displayName}</p>
          {/if}
        </div>

        <a
          href="/?owner={encodeURIComponent(user.name)}"
          class="hidden w-28 shrink-0 text-xs text-base-content/55 hover:text-base-content sm:block"
        >
          {user.machineCount} machine{user.machineCount === 1 ? "" : "s"}
        </a>

        <span class="hidden w-24 shrink-0 text-xs text-base-content/45 md:block">
          {joined(user.createdAt)}
        </span>

        {#if data.editable}
          <RowMenu label="Actions for {user.name}">
            <li>
              <button type="button" onclick={() => (renaming = user)}>Rename</button>
            </li>
            <li>
              <ConfirmButton
                action="?/delete"
                label="Delete user"
                confirmLabel="Delete user"
                consequence={user.machineCount
                  ? `${user.name} still owns ${user.machineCount} machine(s). The server refuses until those are moved or deleted.`
                  : `${user.name} and every auth key they hold are removed.`}
                fields={{ id: user.id }}
              />
            </li>
          </RowMenu>
        {/if}
      </div>
    {/each}
  </div>
{:else}
  <EmptyState
    icon="lucide:users"
    title="No users yet"
    hint="A user owns machines and appears in your access rules."
  >
    {#snippet action()}
      {#if data.editable}
        <button class="btn btn-primary btn-sm" onclick={() => (adding = true)}>
          Add the first user
        </button>
      {/if}
    {/snippet}
  </EmptyState>
{/if}

<Dialog
  open={adding}
  onclose={() => (adding = false)}
  title="Add user"
  description="A user owns machines and can be named in access rules."
>
  <form
    id="add-user"
    method="POST"
    action="?/create"
    use:enhance={afterSubmit(() => (adding = false))}
    class="flex flex-col gap-3"
  >
    <label class="flex flex-col gap-1">
      <span class="eyebrow">Name</span>
      <input name="name" required class="input" placeholder="ci" />
    </label>
    <label class="flex flex-col gap-1">
      <span class="eyebrow">Display name</span>
      <input name="displayName" class="input" placeholder="Build runners" />
    </label>
    <label class="flex flex-col gap-1">
      <span class="eyebrow">Email</span>
      <input name="email" type="email" class="input" placeholder="ci@example.com" />
    </label>
  </form>

  {#snippet footer()}
    <button type="button" class="btn btn-ghost btn-sm" onclick={() => (adding = false)}>
      Cancel
    </button>
    <button form="add-user" class="btn btn-primary btn-sm">Add user</button>
  {/snippet}
</Dialog>

<Dialog
  open={renaming !== null}
  onclose={() => (renaming = null)}
  title="Rename {renaming?.name ?? ''}"
  description="Access rules that name the old user stop matching, so update the policy in the same change."
>
  <form
    id="rename-user"
    method="POST"
    action="?/rename"
    use:enhance={afterSubmit(() => (renaming = null))}
  >
    <input type="hidden" name="id" value={renaming?.id ?? ""} />
    <label class="flex flex-col gap-1">
      <span class="eyebrow">New name</span>
      <input name="name" required class="input" value={renaming?.name ?? ""} />
    </label>
  </form>

  {#snippet footer()}
    <button type="button" class="btn btn-ghost btn-sm" onclick={() => (renaming = null)}>
      Cancel
    </button>
    <button form="rename-user" class="btn btn-warning btn-sm">Rename user</button>
  {/snippet}
</Dialog>
