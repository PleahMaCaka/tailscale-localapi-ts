<script lang="ts">
import Icon from "@iconify/svelte"
import { enhance } from "$app/forms"
import PageHeader from "$lib/components/layout/PageHeader.svelte"
import Section from "$lib/components/layout/Section.svelte"

let { data, form } = $props()

const editable = $derived(Boolean(data.dns?.writable))

const fromFile = $derived(data.source === "config")
</script>

<PageHeader
  title="DNS"
  count={fromFile
    ? "Headscale has no DNS API, so these values come from its config file"
    : "Applies to every machine on the tailnet"}
/>

{#if !data.dns}
  <div class="rounded-box border border-warning/40 bg-base-100 p-5">
    <div class="flex items-start gap-3">
      <Icon icon="lucide:file-question-mark" class="mt-0.5 size-5 shrink-0 text-warning" />
      <div>
        <p class="text-sm font-medium">No config file to read.</p>
        <p class="mt-1 text-sm text-base-content/60">
          Point <code class="text-xs">HEADSCALE_CONFIG_PATH</code> at the server's
          <code class="text-xs">config.yaml</code>.
        </p>
        {#if data.reason}
          <p class="mt-2 text-xs text-base-content/40">{data.reason}</p>
        {/if}
      </div>
    </div>
  </div>
{:else}
  {#if !editable}
    <div class="flex items-start gap-3 rounded-box border border-base-300 bg-base-100 p-4">
      <Icon icon="lucide:eye" class="mt-0.5 size-4 shrink-0 text-base-content/50" />
      <p class="text-sm text-base-content/60">
        Read-only. This process cannot write
        <code class="text-xs">{data.dns.path}</code>.
      </p>
    </div>
  {/if}

  {#if form?.reason}
    <div class="alert alert-error">
      <Icon icon="lucide:circle-x" class="size-4" />
      <span>{form.reason}</span>
    </div>
  {:else if form?.success}
    <div class="flex items-start gap-3 rounded-box border border-success/40 bg-base-100 p-4">
      <Icon icon="lucide:circle-check" class="mt-0.5 size-4 shrink-0 text-success" />
      <p class="text-sm">
        Saved.
        {#if form.restartNeeded}
          Headscale reads this file at startup, so restart it before the change takes
          effect.
        {/if}
      </p>
    </div>
  {/if}

  <form method="POST" action="?/save" use:enhance class="flex flex-col gap-5">
    {#if fromFile}
      <Section
        title="Tailnet name"
        hint="Machines answer to [machine].[tailnet name] when MagicDNS is on."
      >
        <input
          name="baseDomain"
          value={data.dns.baseDomain}
          disabled={!editable}
          class="input w-full max-w-sm text-sm"
          aria-label="Tailnet name"
        />
      </Section>
    {/if}

    <Section title="Name resolution" hint="How machines find each other by name.">
      <label class="flex items-start justify-between gap-4">
        <span>
          <span class="block text-sm font-medium">MagicDNS</span>
          <span class="block text-xs text-base-content/55">
            Reach machines by name instead of address.
          </span>
        </span>
        <input
          type="checkbox"
          name="magicDns"
          checked={data.dns.magicDns}
          disabled={!editable}
          class="toggle toggle-primary"
        />
      </label>

      {#if fromFile}
        <label class="flex items-start justify-between gap-4">
          <span>
            <span class="block text-sm font-medium">Override local resolvers</span>
            <span class="block text-xs text-base-content/55">
              Ignore whatever resolvers each machine already has.
            </span>
          </span>
          <input
            type="checkbox"
            name="override"
            checked={data.dns.override}
            disabled={!editable}
            class="toggle toggle-warning"
          />
        </label>
      {/if}
    </Section>

    <Section title="Nameservers" hint="One per line. Handed to every machine.">
      <textarea
        name="nameservers"
        rows="4"
        disabled={!editable}
        class="textarea w-full text-xs leading-6"
        aria-label="Nameservers"
        placeholder="1.1.1.1"
        value={data.dns.globalNameservers.join("\n")}
      ></textarea>
    </Section>

    <Section title="Search domains" hint="Suffixes tried when a bare hostname is looked up.">
      <textarea
        name="searchDomains"
        rows="3"
        disabled={!editable}
        class="textarea w-full text-xs leading-6"
        aria-label="Search domains"
        placeholder="example.com"
        value={data.dns.searchDomains.join("\n")}
      ></textarea>
    </Section>

    {#if editable}
      <div class="flex justify-end">
        <button class="btn btn-primary btn-sm">
          {fromFile ? "Write config file" : "Save DNS settings"}
        </button>
      </div>
    {/if}
  </form>
{/if}
