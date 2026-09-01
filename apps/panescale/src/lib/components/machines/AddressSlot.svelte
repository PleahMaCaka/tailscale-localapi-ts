<script lang="ts">
let {
  addresses,
  online,
  size = "row"
}: {
  addresses: string[]
  online: boolean
  size?: "row" | "large"
} = $props()

const ipv4 = $derived(addresses.find(address => address.includes(".")) ?? "")

const octets = $derived(ipv4.split("."))

const prefix = $derived(octets.slice(0, 3).join("."))

const port = $derived(octets[3] ?? "--")
</script>

<div
  class="flex shrink-0 items-center gap-2 rounded-field border border-base-300 bg-base-200 px-2 py-1 tracking-tight"
  class:min-w-28={size === "row"}
  class:min-w-36={size === "large"}
>
  <span
    class="size-1.5 shrink-0 rounded-full"
    class:bg-success={online}
    class:bg-base-content={!online}
    class:opacity-25={!online}
    aria-hidden="true"
  ></span>

  <span class="flex items-baseline gap-px leading-none">
    <span
      class="text-base-content/35"
      class:text-[0.625rem]={size === "row"}
      class:text-xs={size === "large"}>{prefix}.</span
    >
    <span
      class="font-semibold text-base-content"
      class:text-sm={size === "row"}
      class:text-lg={size === "large"}>{port}</span
    >
  </span>
</div>
