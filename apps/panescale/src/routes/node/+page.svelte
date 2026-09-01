<script lang="ts">
import Icon from "@iconify/svelte"
import { enhance } from "$app/forms"
import PageHeader from "$lib/components/layout/PageHeader.svelte"
import Section from "$lib/components/layout/Section.svelte"
import AddressSlot from "$lib/components/machines/AddressSlot.svelte"
import ConfirmButton from "$lib/components/ui/ConfirmButton.svelte"
import CopyField from "$lib/components/ui/CopyField.svelte"
import Tag from "$lib/components/ui/Tag.svelte"
import { PREF_TOGGLES } from "$lib/tailnet/prefs"

let { data, form } = $props()

const stateTone: Record<string, string> = {
  Running: "text-success",
  Starting: "text-info",
  NeedsLogin: "text-warning",
  NeedsMachineAuth: "text-warning",
  Stopped: "text-base-content/50",
  NoState: "text-base-content/50"
}
</script>

<PageHeader
  title="This machine"
  count="Read straight from the daemon here, not from the control plane"
/>

{#if !data.reachable}
  <div class="rounded-box border border-error/50 bg-base-100 p-5">
    <div class="flex items-start gap-3">
      <Icon icon="lucide:unplug" class="mt-0.5 size-5 shrink-0 text-error" />
      <div>
        <p class="text-sm font-medium">No Tailscale daemon answering.</p>
        <p class="mt-1 text-sm text-base-content/60">
          Tried <code class="text-xs">{data.socketPath}</code>. Start tailscaled,
          or point <code class="text-xs">TAILSCALE_LOCALAPI_SOCKET</code> at its
          socket.
        </p>
      </div>
    </div>
  </div>
{:else if data.daemon && data.self}
  {#if form?.reason}
    <div class="alert alert-error">
      <Icon icon="lucide:circle-x" class="size-4" />
      <span>{form.reason}</span>
    </div>
  {/if}

  <section class="flex flex-wrap items-center gap-4 rounded-box border border-base-300 bg-base-100 p-5">
    <AddressSlot addresses={data.self.addresses} online={data.self.online} size="large" />
    <div class="min-w-0 flex-1">
      <h2 class="truncate text-base font-semibold tracking-tight">{data.self.name}</h2>
      <p class="truncate text-xs text-base-content/45">{data.self.dnsName}</p>
    </div>
    <dl class="flex flex-wrap gap-x-8 gap-y-2">
      <div>
        <dt class="eyebrow">Backend</dt>
        <dd class="text-sm {stateTone[data.daemon.backendState] ?? ''}">
          {data.daemon.backendState}
        </dd>
      </div>
      <div>
        <dt class="eyebrow">Tailnet</dt>
        <dd class="text-sm">{data.daemon.tailnet}</dd>
      </div>
      <div>
        <dt class="eyebrow">Relay</dt>
        <dd class="text-sm">{data.self.relay}</dd>
      </div>
      <div>
        <dt class="eyebrow">Peers online</dt>
        <dd class="text-sm">{data.onlineCount} / {data.peerCount + 1}</dd>
      </div>
      <div>
        <dt class="eyebrow">Daemon</dt>
        <dd class="text-sm">{data.daemon.version}</dd>
      </div>
    </dl>
  </section>

  {#if data.daemon.health.length}
    <Section title="Health" hint="Reported by tailscaled.">
      <ul class="flex flex-col gap-2">
        {#each data.daemon.health as warning (warning)}
          <li class="flex gap-2 text-sm text-warning">
            <Icon icon="lucide:triangle-alert" class="mt-0.5 size-4 shrink-0" />
            {warning}
          </li>
        {/each}
      </ul>
    </Section>
  {/if}

  <Section title="Identity" hint="What this machine looks like to the tailnet.">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="flex flex-col gap-1.5">
        {#each data.self.addresses as address (address)}
          <CopyField value={address} />
        {/each}
      </div>
      <div>
        <p class="eyebrow">Tags</p>
        <div class="mt-1.5 flex flex-wrap gap-1">
          {#each data.self.tags as tag (tag)}
            <Tag {tag} />
          {:else}
            <span class="text-sm text-base-content/45">None</span>
          {/each}
        </div>
      </div>
    </div>
  </Section>

  <Section title="Preferences" hint="Each toggle patches the daemon's prefs immediately.">
    <form method="POST" action="?/updatePrefs" use:enhance class="flex flex-col gap-4">
      {#each PREF_TOGGLES as toggle (toggle.field)}
        <label class="flex items-start justify-between gap-4">
          <span>
            <span class="block text-sm font-medium">{toggle.label}</span>
            <span class="block text-xs text-base-content/55">{toggle.hint}</span>
          </span>
          <input
            type="checkbox"
            name={toggle.field}
            class="toggle toggle-warning"
            checked={data.toggles?.[toggle.field]}
          />
        </label>
      {/each}
      <button class="btn btn-warning btn-sm self-start">Apply changes</button>
    </form>
  </Section>

  <Section title="Exit node" hint="Send all traffic from this machine through another peer.">
    <form method="POST" action="?/setExitNode" use:enhance class="flex flex-wrap gap-3">
      <select name="exitNodeId" class="select select-sm w-64" aria-label="Exit node">
        <option value="">No exit node</option>
        {#each data.exitNodes ?? [] as node (node.id)}
          <option value={node.id} selected={node.id === data.exitNodeId}>{node.name}</option>
        {/each}
      </select>
      <button class="btn btn-warning btn-sm">Use exit node</button>
    </form>
  </Section>

  <Section tone="breaking" title="Breaking" hint="These take this machine off the tailnet.">
    <div class="flex flex-wrap gap-3">
      <ConfirmButton
        variant="button"
        action="?/logout"
        label="Log out"
        confirmLabel="Log out"
        consequence="This machine leaves the tailnet and needs to log in again before it can reach any peer. On a machine you only reach over Tailscale, that means losing access."
      />
      <ConfirmButton
        variant="button"
        action="?/resetAuth"
        label="Reset auth"
        confirmLabel="Reset auth"
        consequence="Stored credentials are cleared, so re-authentication starts from scratch rather than reusing a saved profile."
      />
    </div>
  </Section>
{/if}
