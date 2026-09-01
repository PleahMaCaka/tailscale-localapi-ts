<script lang="ts">
import Icon from "@iconify/svelte"
import PageHeader from "$lib/components/layout/PageHeader.svelte"
import PolicyEditor from "$lib/components/policy/PolicyEditor.svelte"

let { data, form } = $props()
</script>

<PageHeader
  title="Access control"
  count="One document decides who can reach what across the whole tailnet"
/>

{#if !data.available}
  <div class="rounded-box border border-warning/40 bg-base-100 p-5">
    <div class="flex items-start gap-3">
      <Icon icon="lucide:file-lock-2" class="mt-0.5 size-5 shrink-0 text-warning" />
      <div>
        <p class="text-sm font-medium">A file owns this policy, so it is read-only here.</p>
        <p class="mt-1 text-sm text-base-content/60">
          Set <code class="text-xs">policy.mode: database</code> in the Headscale
          config and restart the server to edit it from PaneScale.
        </p>
        {#if data.reason}
          <p class="mt-2 text-xs text-base-content/40">{data.reason}</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if form?.reason}
  <div class="rounded-box border border-error/50 bg-base-100 p-5">
    <div class="flex items-start gap-3">
      <Icon icon="lucide:circle-x" class="mt-0.5 size-5 shrink-0 text-error" />
      <div>
        <p class="text-sm font-medium text-error">Rejected. Nothing was applied.</p>
        <p class="mt-1 text-xs leading-5 text-base-content/70">{form.reason}</p>
      </div>
    </div>
  </div>
{/if}

{#key data.updatedAt}
  <PolicyEditor
    policy={data.policy}
    updatedAt={data.updatedAt}
    version={data.version}
    editable={data.available}
  />
{/key}
