<script lang="ts">
import Icon from "@iconify/svelte"
import { enhance } from "$app/forms"
import PageHeader from "$lib/components/layout/PageHeader.svelte"
import Section from "$lib/components/layout/Section.svelte"
import ConfirmButton from "$lib/components/ui/ConfirmButton.svelte"
import CopyField from "$lib/components/ui/CopyField.svelte"
import Dialog from "$lib/components/ui/Dialog.svelte"
import EmptyState from "$lib/components/ui/EmptyState.svelte"
import RowMenu from "$lib/components/ui/RowMenu.svelte"
import Tag from "$lib/components/ui/Tag.svelte"

let { data, form } = $props()

let issuingAuthKey = $state(false)
let issuingApiKey = $state(false)

const secret = $derived(form?.issuedKey ?? "")

let dismissed = $state("")

const showSecret = $derived(secret !== "" && secret !== dismissed)

const stamp = (value: string | null) =>
  value ? new Date(value).toLocaleString() : "never"

const expired = (value: string | null) =>
  value !== null && Date.parse(value) <= Date.now()

function afterSubmit(close: () => void) {
  return () =>
    async ({ update }: { update: () => Promise<void> }) => {
      close()
      await update()
    }
}
</script>

<PageHeader title="Keys" count="Auth keys let a machine join without an interactive login" />

{#if form?.reason}
  <div class="alert alert-error">
    <Icon icon="lucide:circle-x" class="size-4" />
    <span>{form.reason}</span>
  </div>
{/if}

<Section
  title="Auth keys"
  hint={data.perUser
    ? "Each key belongs to a user and carries the tags it grants."
    : "Keys belong to whoever owns the API token."}
>
  {#snippet action()}
    <button class="btn btn-primary btn-sm gap-1.5" onclick={() => (issuingAuthKey = true)}>
      <Icon icon="lucide:plus" class="size-4" />
      Issue key
    </button>
  {/snippet}

  {#each data.keysByUser as group (group.user.id || group.user.name)}
    {#if group.keys.length}
      {#if data.perUser}
        <p class="eyebrow">{group.user.name}</p>
      {/if}
      <div class="overflow-hidden rounded-field border border-base-300">
        {#each group.keys as key (key.id)}
          <div
            class="flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0"
            class:opacity-45={key.used || expired(key.expires)}
          >
            <code class="w-40 shrink-0 truncate text-xs">{key.preview}</code>

            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {#each key.tags as tag (tag)}
                <Tag {tag} />
              {/each}
              {#if key.reusable}
                <span class="rounded-selector border border-base-300 px-1.5 py-0.5 text-[0.6875rem] text-base-content/60">
                  reusable
                </span>
              {/if}
              {#if key.ephemeral}
                <span class="rounded-selector border border-base-300 px-1.5 py-0.5 text-[0.6875rem] text-base-content/60">
                  ephemeral
                </span>
              {/if}
              {#if key.used}
                <span class="rounded-selector border border-base-300 px-1.5 py-0.5 text-[0.6875rem] text-base-content/60">
                  used
                </span>
              {/if}
            </div>

            <span class="hidden w-44 shrink-0 text-xs text-base-content/50 sm:block">
              {expired(key.expires) ? "expired" : `expires ${stamp(key.expires)}`}
            </span>

            {#if !expired(key.expires)}
              <RowMenu label="Actions for this key">
                <li>
                  <ConfirmButton
                    action="?/revokeAuthKey"
                    label="Revoke key"
                    confirmLabel="Revoke key"
                    consequence="No new machine can register with this key. Machines already using it stay on the tailnet."
                    fields={{ user: group.user.id, id: key.id }}
                  />
                </li>
              </RowMenu>
            {:else}
              <span class="w-8 shrink-0"></span>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <EmptyState
      icon="lucide:key-round"
      title="No auth keys"
      hint="Issue one, then run tailscale up --authkey on the machine you want to add."
    />
  {/each}
</Section>

{#if data.apiKeys.length || data.perUser}
  <Section
    tone="danger"
    title="API keys"
    hint="Each one is full administrative access to this control plane."
  >
    {#snippet action()}
      <button class="btn btn-outline btn-error btn-sm gap-1.5" onclick={() => (issuingApiKey = true)}>
        <Icon icon="lucide:plus" class="size-4" />
        Issue API key
      </button>
    {/snippet}

    {#if data.apiKeys.length}
      <div class="overflow-hidden rounded-field border border-base-300">
        {#each data.apiKeys as key (key.id)}
          <div
            class="flex items-center gap-3 border-b border-base-300 px-3 py-2.5 last:border-b-0"
            class:opacity-45={expired(key.expiration)}
          >
            <code class="w-32 shrink-0 text-xs">{key.prefix}</code>
            <span class="min-w-0 flex-1 text-xs text-base-content/50">
              last used {stamp(key.lastSeen)}
            </span>
            <span class="hidden w-44 shrink-0 text-xs text-base-content/50 sm:block">
              {expired(key.expiration) ? "expired" : `expires ${stamp(key.expiration)}`}
            </span>
            {#if !expired(key.expiration)}
              <RowMenu label="Actions for key {key.prefix}">
                <li>
                  <ConfirmButton
                    action="?/expireApiKey"
                    label="Expire key"
                    confirmLabel="Expire key"
                    consequence="Anything authenticating with this key stops working immediately, including PaneScale if this is the key it uses."
                    fields={{ prefix: key.prefix }}
                  />
                </li>
              </RowMenu>
            {:else}
              <span class="w-8 shrink-0"></span>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-sm text-base-content/55">No API keys yet.</p>
    {/if}
  </Section>
{/if}

<Dialog
  open={issuingAuthKey}
  onclose={() => (issuingAuthKey = false)}
  title="Issue an auth key"
  description="Anyone holding the key can add a machine with the tags below."
>
  <form
    id="issue-auth-key"
    method="POST"
    action="?/createAuthKey"
    use:enhance={afterSubmit(() => (issuingAuthKey = false))}
    class="flex flex-col gap-3"
  >
    {#if data.perUser}
      <label class="flex flex-col gap-1">
        <span class="eyebrow">Owner</span>
        <select name="user" class="select">
          {#each data.users as user (user.id)}
            <option value={user.id}>{user.name}</option>
          {/each}
        </select>
      </label>
    {/if}

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1">
        <span class="eyebrow">Valid for (days)</span>
        <input name="days" type="number" min="1" value="1" class="input" />
      </label>
      <label class="flex flex-col gap-1">
        <span class="eyebrow">Tags</span>
        <input name="tags" class="input text-xs" placeholder="tag:edge" />
      </label>
    </div>

    <label class="flex items-start gap-3 rounded-field border border-base-300 p-3">
      <input type="checkbox" name="reusable" class="checkbox checkbox-sm mt-0.5" />
      <span>
        <span class="block text-sm font-medium">Reusable</span>
        <span class="block text-xs text-base-content/55">
          Register more than one machine with the same key.
        </span>
      </span>
    </label>

    <label class="flex items-start gap-3 rounded-field border border-base-300 p-3">
      <input type="checkbox" name="ephemeral" class="checkbox checkbox-sm mt-0.5" />
      <span>
        <span class="block text-sm font-medium">Ephemeral</span>
        <span class="block text-xs text-base-content/55">
          Machines registered with it disappear when they go offline.
        </span>
      </span>
    </label>
  </form>

  {#snippet footer()}
    <button
      type="button"
      class="btn btn-ghost btn-sm"
      onclick={() => (issuingAuthKey = false)}
    >
      Cancel
    </button>
    <button form="issue-auth-key" class="btn btn-primary btn-sm">Issue key</button>
  {/snippet}
</Dialog>

<Dialog
  open={issuingApiKey}
  onclose={() => (issuingApiKey = false)}
  tone="danger"
  title="Issue an API key"
  description="This grants full administrative access to the control plane."
>
  <form
    id="issue-api-key"
    method="POST"
    action="?/createApiKey"
    use:enhance={afterSubmit(() => (issuingApiKey = false))}
  >
    <label class="flex flex-col gap-1">
      <span class="eyebrow">Valid for (days)</span>
      <input name="days" type="number" min="1" value="90" class="input" />
    </label>
  </form>

  {#snippet footer()}
    <button type="button" class="btn btn-ghost btn-sm" onclick={() => (issuingApiKey = false)}>
      Cancel
    </button>
    <button form="issue-api-key" class="btn btn-error btn-sm">Issue API key</button>
  {/snippet}
</Dialog>

<Dialog
  open={showSecret}
  onclose={() => (dismissed = secret)}
  title="Copy this key now"
  description="It is shown once and cannot be retrieved again."
>
  <CopyField value={secret} label="Key" />

  {#snippet footer()}
    <button class="btn btn-primary btn-sm" onclick={() => (dismissed = secret)}>
      Done
    </button>
  {/snippet}
</Dialog>
