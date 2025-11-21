import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // Używamy jsdom dla testowania komponentów React
    environment: "jsdom",

    // Pliki setup wykonywane przed każdym testem
    setupFiles: ["./vitest.setup.ts"],

    // Globalne ustawienia dla testów
    globals: true,

    // Wyklucz testy e2e (Playwright) z Vitest
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/tests/e2e/**",
    ],

    // Konfiguracja coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".astro/",
        "**/*.config.*",
        "**/*.d.ts",
        "**/types.ts",
        "scripts/",
        "public/",
      ],
      // Progi coverage - uruchamiaj tylko gdy użytkownik poprosi o coverage
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // UI mode configuration (uruchamiane tylko przez npm run test:ui)
    // ui: true,

    // Izolacja testów
    isolate: true,

    // Timeout dla testów
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
