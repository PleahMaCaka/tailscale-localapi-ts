import { readdir } from "node:fs/promises"
import lucide from "@iconify-json/lucide/icons.json"

const ICON_PATTERN = /lucide:([a-z0-9-]+)/g

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })

  const nested = await Promise.all(
    entries.map(entry => {
      const path = `${directory}/${entry.name}`
      if (entry.isDirectory()) return sourceFiles(path)

      return Promise.resolve(path.endsWith(".svelte") ? [path] : [])
    })
  )

  return nested.flat()
}

const used = new Set<string>()

for (const file of await sourceFiles("src")) {
  const source = await Bun.file(file).text()
  for (const [, name] of source.matchAll(ICON_PATTERN)) used.add(name)
}

const missing = [...used].filter(name => !(name in lucide.icons))
if (missing.length) {
  console.error(`Not in the lucide set: ${missing.join(", ")}`)
  process.exit(1)
}

const subset = {
  ...lucide,
  icons: Object.fromEntries(
    [...used]
      .sort()
      .map(name => [name, lucide.icons[name as keyof typeof lucide.icons]])
  )
}

await Bun.write("src/lib/icons.json", `${JSON.stringify(subset)}\n`)
console.log(`${used.size} icons written to src/lib/icons.json`)
