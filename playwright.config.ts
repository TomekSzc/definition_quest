import { defineConfig, devices } from "@playwright/test";

/**
 * Konfiguracja Playwright dla testów e2e
 * Zgodnie z wytycznymi - tylko Chromium/Desktop Chrome
 */
export default defineConfig({
  // Ścieżka do foldera z testami
  testDir: "./tests/e2e",

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
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    // Zbieranie trace tylko przy niepowodzeniu
    trace: "retain-on-failure",

    // Screenshot tylko przy niepowodzeniu
    screenshot: "only-on-failure",

    // Video tylko przy niepowodzeniu
    video: "retain-on-failure",
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
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
