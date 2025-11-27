// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

console.log("🔍 Current mode:", import.meta.env.MODE);
console.log("🔍 SUPABASE_URL from process.env:", process.env.SUPABASE_URL);

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    mode: "directory",
    // Runtime mode removed for production - allows Cloudflare Pages to access environment variables
  }),
  env: {
    schema: {
      // Client-side environment variables
      SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
      }),
      SUPABASE_KEY: envField.string({
        context: "client",
        access: "public",
      }),
      // Server-side environment variables
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      E2E_USERNAME_ID: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      E2E_USERNAME: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
      E2E_PASSWORD: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
    validateSecrets: false,
  },
});
