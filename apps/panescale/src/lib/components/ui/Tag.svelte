<script lang="ts">
import { tagHue } from "$lib/tailnet/tagColor"

let { tag, invalid = false }: { tag: string; invalid?: boolean } = $props()

const hue = $derived(tagHue(tag))
</script>

<span
  class="rounded-selector border px-1.5 py-0.5 text-[0.6875rem] leading-4"
  class:border-error={invalid}
  class:bg-error={invalid}
  class:text-error-content={invalid}
  style:color={invalid ? undefined : `oklch(84% 0.09 ${hue})`}
  style:background-color={invalid ? undefined : `oklch(84% 0.09 ${hue} / 0.12)`}
  style:border-color={invalid ? undefined : `oklch(84% 0.09 ${hue} / 0.35)`}
  title={invalid ? "No owner for this tag in the policy" : undefined}
>
  {tag}
</span>
