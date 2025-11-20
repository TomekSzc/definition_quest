import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Załaduj .env.test jeśli istnieje, w przeciwnym razie .env
const envTestPath = path.resolve(process.cwd(), ".env.test");
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envTestPath)) {
  dotenv.config({ path: envTestPath });
  // eslint-disable-next-line no-console
  console.log("✅ Loaded environment from: .env.test");
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  // eslint-disable-next-line no-console
  console.log("⚠️  .env.test not found, using .env");
}

/**
 * Konfiguracja Playwright dla testów e2e
 * Zgodnie z wytycznymi - tylko Chromium/Desktop Chrome
 */
export default defineConfig({
  // Ścieżka do foldera z testami
  testDir: "./tests/e2e",

  // Global Teardown - czyszczenie bazy danych po WSZYSTKICH testach
  globalTeardown: "./tests/e2e/global-teardown.ts",

  // Maksymalny czas wykonania jednego testu
  timeout: 30 * 1000,

  // Oczekiwania w testach
  expect: {
    timeout: 5000,
  },

  // Uruchamiaj testy pojedynczo podczas CI/CD
  fullyParallel: true,

  // Zakaz testów oznaczonych jako .only na CI
  forbidOnly: !!process.env.CI,

  // Liczba powtórzeń przy niepowodzeniu
  retries: process.env.CI ? 2 : 0,

  // Liczba workerów - maksymalne zrównoleglenie
  workers: process.env.CI ? 1 : undefined,

  // Reporter - html dla lokalnego debugowania, github actions dla CI
  reporter: process.env.CI ? [["html"], ["github"]] : [["html"], ["list"]],

  // Ustawienia współdzielone dla wszystkich projektów
  use: {
    // Bazowy URL dla testów
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Zbieranie trace tylko przy niepowodzeniu
    trace: "retain-on-failure",

    // Screenshot tylko przy niepowodzeniu
    screenshot: "only-on-failure",

    // Video tylko przy niepowodzeniu
    video: "retain-on-failure",

    // Timeout dla nawigacji (czekaj dłużej na załadowanie React)
    navigationTimeout: 30000,

    // Użyj data-test-id zamiast domyślnego data-testid
    testIdAttribute: "data-test-id",
  },

  // Konfiguracja projektu testowego - TYLKO Chromium
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Browser contexts dla izolacji środowiska testowego
        contextOptions: {
          // Ignorowanie błędów HTTPS w środowisku dev
          ignoreHTTPSErrors: true,
        },
      },
    },
  ],

  // Uruchom serwer deweloperski przed testami
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
