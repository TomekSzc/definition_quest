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
      // Supabase configuration (accessible on both client and server)
      // Optional to allow GitHub Actions builds with process.env
      SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      SUPABASE_KEY: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
      // OpenRouter API configuration (server-only)
      // Optional to allow GitHub Actions builds with process.env
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Environment name for feature flags (server-only)
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
