<script lang="ts">
import "../app.css"
import Icon from "@iconify/svelte"
import { page } from "$app/state"
import Rail from "$lib/components/layout/Rail.svelte"
import { registerIcons } from "$lib/icons"

registerIcons()

let { data, children } = $props()

const localOnly = $derived(page.url.pathname.startsWith("/node"))
</script>

<div class="flex min-h-screen bg-base-200 max-md:flex-col">
  <Rail kind={data.kind} target={data.target} connected={data.connected} />

  <main class="min-w-0 flex-1">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-5 p-6">
      {#if data.connected || localOnly}
        {@render children()}
      {:else}
        <section class="rounded-box border border-warning/40 bg-base-100 p-6">
          <div class="flex items-start gap-3">
            <Icon icon="lucide:unplug" class="mt-0.5 size-5 shrink-0 text-warning" />
            <div class="flex flex-col gap-3">
              <div>
                <h1 class="text-base font-semibold">
                  {data.kind === "none"
                    ? "Connect PaneScale to a control plane"
                    : `The ${data.kind} control plane is not answering`}
                </h1>
                <p class="mt-1 text-sm text-base-content/60">
                  {data.kind === "none"
                    ? "Set one pair of variables and reload."
                    : `Tried ${data.target}. Check that it is running and that the key is still valid.`}
                </p>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-field border border-base-300 bg-base-200 p-3">
                  <p class="eyebrow">Self-hosted</p>
                  <pre class="mt-1.5 text-xs leading-5 text-base-content/70">HEADSCALE_URL
HEADSCALE_API_KEY</pre>
                </div>
                <div class="rounded-field border border-base-300 bg-base-200 p-3">
                  <p class="eyebrow">Tailscale</p>
                  <pre class="mt-1.5 text-xs leading-5 text-base-content/70">TAILSCALE_TAILNET
TAILSCALE_API_KEY</pre>
                </div>
              </div>

              <p class="text-sm text-base-content/60">
                In the Nix dev shell, <code class="text-xs">tailnet up</code> starts
                a throwaway server and issues a key.
                <a class="link link-primary" href="/node">This machine</a> works without one.
              </p>
            </div>
          </div>
        </section>
      {/if}
    </div>
  </main>
</div>
