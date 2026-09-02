import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"
import starlightTypeDoc, { typeDocSidebarGroup } from "starlight-typedoc"

const [owner, repository] = (process.env.GITHUB_REPOSITORY ?? "").split("/")

export default defineConfig({
  // Project pages live under /<repository>, and both parts follow a rename
  site: owner
    ? `https://${owner.toLowerCase()}.github.io`
    : "http://127.0.0.1:4271",
  base: repository ? `/${repository}` : "/",
  server: { host: "127.0.0.1", port: 4271 },
  integrations: [
    starlight({
      title: "tailnet",
      description:
        "One TypeScript client for Tailscale and Headscale control planes",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: `https://github.com/${owner ?? "pleahmacaka"}/${repository ?? "tailnet"}`
        }
      ],
      plugins: [
        starlightTypeDoc({
          entryPoints: [
            "../../packages/core",
            "../../packages/tailscale",
            "../../packages/headscale",
            "../../packages/tailscaled",
            "../../packages/tailcat"
          ],
          output: "api",
          sidebar: { label: "API", collapsed: true },
          typeDoc: {
            entryPointStrategy: "packages",
            entryFileName: "index",
            packageOptions: {
              entryPoints: ["src/index.ts"],
              excludeInternal: true
            }
          }
        })
      ],
      sidebar: [
        {
          label: "Start here",
          items: [{ autogenerate: { directory: "start" } }]
        },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        {
          label: "Packages",
          items: [{ autogenerate: { directory: "reference" } }]
        },
        typeDocSidebarGroup
      ]
    })
  ]
})
