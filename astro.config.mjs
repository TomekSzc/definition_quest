// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    // Cloudflare Pages configuration - environment variables are accessible via astro:env
  }),
  env: {
    schema: {
      // Supabase configuration
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
        optional: false,
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "public",
        optional: false,
      }),
      // OpenRouter API configuration
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: false,
      }),
      // Environment name for feature flags
      ENV_NAME: envField.enum({
        context: "server",
        access: "public",
        optional: true,
        default: "dev",
        values: ["dev", "test", "prod"],
      }),
    },
  },
});
