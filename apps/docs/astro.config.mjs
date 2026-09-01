import starlight from "@astrojs/starlight"
import { defineConfig } from "astro/config"

export default defineConfig({
  server: { host: "127.0.0.1", port: 4271 },
  integrations: [
    starlight({
      title: "tailnet.ts",
      description:
        "One TypeScript client for Tailscale and Headscale control planes",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/PleahMaCaka/tailnet.ts"
        }
      ],
      sidebar: [
        {
          label: "Start here",
          items: [{ autogenerate: { directory: "start" } }]
        },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        {
          label: "Reference",
          items: [{ autogenerate: { directory: "reference" } }]
        }
      ]
    })
  ]
})
