# Testy E2E - Playwright

Testy end-to-end dla aplikacji Definition Quest używające Playwright i Page Object Model.

## Spis treści

- [Wymagania](#wymagania)
- [Konfiguracja](#konfiguracja)
- [Uruchamianie testów](#uruchamianie-testów)
- [Page Object Model](#page-object-model)
- [Pisanie testów](#pisanie-testów)
- [Best Practices](#best-practices)

## Wymagania

- Node.js 18+
- npm lub yarn
- Playwright zainstalowany (`@playwright/test`)

## Konfiguracja

### 1. Zmienne środowiskowe

Skopiuj `.env.example` do `.env` i uzupełnij wartości:

```bash
cp .env.example .env
```

Wymagane zmienne dla testów E2E:

```env
# E2E Testing credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=your_test_password_here
```

### 2. Instalacja przeglądarek

Jeśli jeszcze nie zainstalowałeś przeglądarek Playwright:

```bash
npx playwright install chromium
```

## Uruchamianie testów

### Wszystkie testy

```bash
npm run test:e2e
```

### Tryb UI (interaktywny)

```bash
npm run test:e2e:ui
```

### Tryb debug (krok po kroku)

```bash
npm run test:e2e:debug
```

### Konkretny plik testowy

```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

### Konkretny test

```bash
npx playwright test -g "should login with valid credentials"
```

### Z nagłówkiem (headed mode)

```bash
npx playwright test --headed
```

### Generowanie testów (Codegen)

```bash
npm run test:e2e:codegen
```

### Raport z testów

```bash
npm run test:e2e:report
```

## Page Object Model

Projekt używa wzorca Page Object Model (POM) dla lepszej organizacji i maintainability testów.

### Struktura POM

```
tests/e2e/helpers/page-objects.ts
├── BasePage          # Klasa bazowa z wspólną funkcjonalnością
├── LoginPage         # POM dla strony logowania
├── BoardsPage        # POM dla strony boards (po zalogowaniu)
└── HomePage          # POM dla strony głównej
```

### Przykład użycia POM

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, BoardsPage } from "../helpers/page-objects";

test("user can login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const boardsPage = new BoardsPage(page);

  // Przejdź do strony logowania
  await loginPage.goto();

  // Zaloguj się używając zmiennych środowiskowych
  await loginPage.loginWithEnvCredentials();

  // Weryfikuj przekierowanie
  await loginPage.waitForSuccessfulLogin();
  await boardsPage.verifyOnBoardsPage();
});
```

### BasePage - metody wspólne

Wszystkie Page Objects dziedziczą z `BasePage` i mają dostęp do:

- `goto(path: string)` - nawigacja do ścieżki
- `waitForNavigation(url: string | RegExp)` - czekanie na URL
- `getTitle()` - pobieranie tytułu strony
- `waitForElement(locator: Locator)` - czekanie na element
- `isVisible(locator: Locator)` - sprawdzanie widoczności
- `getByTestId(testId: string)` - znajdowanie po data-test-id

### LoginPage - główne metody

```typescript
const loginPage = new LoginPage(page);

// Nawigacja
await loginPage.goto();

// Wypełnianie formularza
await loginPage.fillEmail("test@example.com");
await loginPage.fillPassword("password123");
await loginPage.clickSubmit();

// Lub wszystko naraz
await loginPage.login("test@example.com", "password123");

// Lub ze zmiennych środowiskowych
await loginPage.loginWithEnvCredentials();

// Nawigacja
await loginPage.goToSignUp();
await loginPage.goToForgotPassword();

// Weryfikacja
await loginPage.verifyPageTitle();
await loginPage.isLoginFormVisible();
await loginPage.waitForSuccessfulLogin();

// Toggle hasła
await loginPage.togglePasswordVisibility();
```

### Locatory używające data-test-id

Wszystkie kluczowe elementy mają atrybuty `data-test-id` dla stabilnych selektorów:

- `login-form` - formularz logowania
- `login-email-input` - pole email
- `login-password-input` - pole hasła
- `login-password-input-toggle` - ikona pokazywania/ukrywania hasła
- `login-submit-button` - przycisk logowania
- `signup-link` - link do rejestracji
- `forgot-password-link` - link do przypomnienia hasła

## Pisanie testów

### Struktura testu (AAA Pattern)

```typescript
test("descriptive test name", async ({ page }) => {
  // Arrange - przygotowanie
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Act - akcja
  await loginPage.login("test@example.com", "password123");

  // Assert - weryfikacja
  await expect(page).toHaveURL(/\/boards/);
});
```

### Hooks testowe

```typescript
test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  // Przed każdym testem
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // Po każdym teście
  test.afterEach(async ({ page }) => {
    // cleanup if needed
  });

  test("test case", async () => {
    // test implementation
  });
});
```

### Pomijanie testów warunkowo

```typescript
test("requires credentials", async () => {
  test.skip(!process.env.E2E_USERNAME, "E2E_USERNAME must be set");
  // test implementation
});
```

### Asercje

```typescript
// URL
await expect(page).toHaveURL(/\/boards/);
await expect(page).toHaveURL("http://localhost:4321/boards");

// Widoczność
await expect(loginPage.emailInput).toBeVisible();
await expect(loginPage.submitButton).toBeEnabled();

// Tekst
await expect(loginPage.pageTitle).toHaveText("Definition quest");
await expect(loginPage.breadcrumbs).toContainText("Boards");

// Atrybuty
await expect(loginPage.emailInput).toHaveAttribute("type", "email");

// Liczba elementów
await expect(page.locator(".board-item")).toHaveCount(5);
```

## Best Practices

### 1. Używaj Page Object Model

❌ **Źle:**

```typescript
test("login", async ({ page }) => {
  await page.goto("/");
  await page.fill('[data-test-id="login-email-input"]', "test@example.com");
  await page.fill('[data-test-id="login-password-input"]', "password");
  await page.click('[data-test-id="login-submit-button"]');
});
```

✅ **Dobrze:**

```typescript
test("login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithEnvCredentials();
});
```

### 2. Preferuj data-test-id

❌ **Źle:**

```typescript
page.locator("div > form > input.email-field");
```

✅ **Dobrze:**

```typescript
loginPage.getByTestId("login-email-input");
// lub
loginPage.emailInput; // (już używa data-test-id wewnętrznie)
```

### 3. Używaj asercji Playwright

❌ **Źle:**

```typescript
const isVisible = await loginPage.emailInput.isVisible();
expect(isVisible).toBe(true);
```

✅ **Dobrze:**

```typescript
await expect(loginPage.emailInput).toBeVisible();
```

### 4. Czekaj na stany, nie używaj timeoutów

❌ **Źle:**

```typescript
await page.click(loginPage.submitButton);
await page.waitForTimeout(3000); // ❌
```

✅ **Dobrze:**

```typescript
await loginPage.clickSubmit();
await loginPage.waitForSuccessfulLogin(); // czeka na URL
```

### 5. Izoluj testy

Każdy test powinien być niezależny i nie polegać na stanie z poprzednich testów.

```typescript
test.beforeEach(async ({ page }) => {
  // Każdy test zaczyna od czystego stanu
  await loginPage.goto();
});
```

### 6. Używaj Browser Context dla izolacji

Playwright automatycznie tworzy nowy context dla każdego testu, co zapewnia izolację cookies, storage, etc.

### 7. Visual Regression Testing

```typescript
test("visual test", async ({ page }) => {
  await loginPage.goto();
  await expect(page).toHaveScreenshot("login-page.png", {
    fullPage: true,
  });
});
```

### 8. Debugowanie

```typescript
// Wstrzymaj wykonanie testu
await page.pause();

// Uruchom z interfejsem debug
// npm run test:e2e:debug

// Zobacz trace po niepowodzeniu
// Automatycznie zbierany, zobacz w playwright-report/
```

## Struktura folderów testowych

```
tests/e2e/
├── auth/
│   └── login.spec.ts       # Testy logowania
├── boards/
│   └── ...                 # Testy dla boards (do dodania)
├── helpers/
│   └── page-objects.ts     # Page Object Models
└── README.md               # Ta dokumentacja
```

## Raportowanie

Po uruchomieniu testów, raporty są dostępne w:

- `playwright-report/` - raport HTML
- `.trace` files - trace dla nieudanych testów

Otwórz raport:

```bash
npm run test:e2e:report
```

Otwórz trace:

```bash
npx playwright show-trace path/to/trace.zip
```

## Troubleshooting

### Testy nie przechodzą lokalnie

1. Sprawdź czy serwer deweloperski działa: `npm run dev`
2. Sprawdź zmienne środowiskowe w `.env`
3. Uruchom w trybie headed: `npx playwright test --headed`
4. Użyj trybu debug: `npm run test:e2e:debug`

### Baza danych nie jest w poprawnym stanie

Upewnij się że masz użytkownika testowego w bazie danych z credentialami z `.env`.

### Timeouty

Domyślny timeout to 30s. Możesz go zwiększyć w `playwright.config.ts`:

```typescript
export default defineConfig({
  timeout: 60 * 1000, // 60 sekund
});
```

## Zasoby

- [Dokumentacja Playwright](https://playwright.dev/)
- [Best Practices Playwright](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Fixtures](https://playwright.dev/docs/test-fixtures)
