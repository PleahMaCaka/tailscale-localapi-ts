import { fail } from "@sveltejs/kit"
import { TailnetError } from "tailnet.ts"

/** Runs a control-plane mutation and turns any failure into a form error. */
export async function attempt<T>(work: () => Promise<T>) {
  try {
    await work()

    return { success: true }
  } catch (error) {
    const reason =
      error instanceof TailnetError ? error.message : "Something went wrong"

    return fail(500, { reason })
  }
}

export function toList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .replaceAll(",", "\n")
    .split("\n")
    .map(entry => entry.trim())
    .filter(Boolean)
}
