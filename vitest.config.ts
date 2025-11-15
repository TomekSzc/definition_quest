import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Używamy jsdom dla testowania komponentów React
    environment: "jsdom",

    // Pliki setup wykonywane przed każdym testem
    setupFiles: ["./vitest.setup.ts"],

    // Globalne ustawienia dla testów
    globals: true,

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
