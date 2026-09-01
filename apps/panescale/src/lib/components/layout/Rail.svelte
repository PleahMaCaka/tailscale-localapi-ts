<script lang="ts">
import Icon from "@iconify/svelte"
import { page } from "$app/state"

let {
  kind,
  target,
  connected
}: {
  kind: "headscale" | "tailscale" | "none"
  target: string
  connected: boolean
} = $props()

const links = [
  { href: "/", label: "Machines", icon: "lucide:server" },
  { href: "/users", label: "Users", icon: "lucide:users" },
  { href: "/acl", label: "Access control", icon: "lucide:shield" },
  { href: "/dns", label: "DNS", icon: "lucide:globe" },
  { href: "/keys", label: "Keys", icon: "lucide:key-round" },
  { href: "/node", label: "This machine", icon: "lucide:monitor-dot" }
]

const active = (href: string) =>
  href === "/" ? page.url.pathname === "/" : page.url.pathname.startsWith(href)
</script>

<aside
  class="flex w-56 shrink-0 flex-col border-r border-base-300 bg-base-100 max-md:w-full max-md:border-r-0 max-md:border-b"
>
  <div class="flex items-center gap-2.5 px-5 py-5">
    <span
      class="flex size-7 items-center justify-center rounded-field border border-primary/40 bg-primary/10"
    >
      <Icon icon="lucide:grip" class="size-4 text-primary" />
    </span>
    <span class="text-[0.9375rem] font-semibold tracking-tight">PaneScale</span>
  </div>

  <nav class="flex-1 px-3">
    <ul class="flex flex-col gap-0.5 max-md:flex-row max-md:overflow-x-auto">
      {#each links as link (link.href)}
        <li>
          <a
            href={link.href}
            aria-current={active(link.href) ? "page" : undefined}
            class="flex items-center gap-2.5 rounded-field px-2.5 py-2 text-sm transition-colors {active(
              link.href
            )
              ? 'bg-base-300 text-base-content'
              : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'}"
          >
            <Icon
              icon={link.icon}
              class="size-4 {active(link.href) ? 'text-primary' : 'opacity-60'}"
            />
            {link.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="border-t border-base-300 px-5 py-4 max-md:hidden">
    <p class="eyebrow">Control plane</p>
    <div class="mt-1.5 flex items-center gap-2">
      <span
        class="size-1.5 shrink-0 rounded-full"
        class:bg-success={connected}
        class:bg-error={!connected}
        aria-hidden="true"
      ></span>
      <span class="text-sm capitalize">{kind === "none" ? "Not set" : kind}</span>
    </div>
    {#if target}
      <p class="mt-1 truncate text-[0.6875rem] text-base-content/45" title={target}>
        {target}
      </p>
    {/if}
  </div>
</aside>
