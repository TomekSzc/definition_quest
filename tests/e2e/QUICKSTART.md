# Quick Start - Testy E2E

Szybki start z testami E2E używając Page Object Model.

## 1. Konfiguracja (jednorazowo)

### Krok 1: Zainstaluj przeglądarki

```bash
npx playwright install chromium
```

### Krok 2: Ustaw zmienne środowiskowe

Skopiuj i edytuj `.env`:

```bash
cp .env.example .env
```

Dodaj do `.env`:

```env
E2E_USERNAME=your_test_user@example.com
E2E_PASSWORD=your_test_password
```

## 2. Uruchom testy

### Wszystkie testy E2E

```bash
npm run test:e2e
```

### Tryb interaktywny (UI)

```bash
npm run test:e2e:ui
```

### Tryb debug (krok po kroku)

```bash
npm run test:e2e:debug
```

## 3. Napisz pierwszy test

Utwórz plik `tests/e2e/example.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "./helpers/page-objects";

test.describe("My First Test", () => {
  test("should login successfully", async ({ page }) => {
    // 1. Utwórz Page Object
    const loginPage = new LoginPage(page);

    // 2. Przejdź do strony
    await loginPage.goto();

    // 3. Wykonaj akcję
    await loginPage.loginWithEnvCredentials();

    // 4. Weryfikuj rezultat
    await expect(page).toHaveURL(/\/boards/);
  });
});
```

## 4. Uruchom swój test

```bash
npx playwright test tests/e2e/example.spec.ts
```

## Struktura Page Object

### Dostępne Page Objects

```typescript
import {
  BasePage, // Klasa bazowa
  LoginPage, // Strona logowania
  BoardsPage, // Strona boards
  HomePage, // Strona główna
} from "./helpers/page-objects";
```

### Przykłady użycia

#### LoginPage

```typescript
const loginPage = new LoginPage(page);

// Nawigacja
await loginPage.goto();

// Logowanie - opcja 1 (ze zmiennych środowiskowych)
await loginPage.loginWithEnvCredentials();

// Logowanie - opcja 2 (parametry)
await loginPage.login("test@example.com", "password123");

// Logowanie - opcja 3 (krok po kroku)
await loginPage.fillEmail("test@example.com");
await loginPage.fillPassword("password123");
await loginPage.clickSubmit();

// Weryfikacja
await loginPage.verifyPageTitle();
await loginPage.waitForSuccessfulLogin();
```

#### BoardsPage

```typescript
const boardsPage = new BoardsPage(page);

// Nawigacja
await boardsPage.goto();

// Weryfikacja
await boardsPage.verifyOnBoardsPage();
const isLoggedIn = await boardsPage.isUserLoggedIn();
```

## Przydatne komendy

```bash
# Zobacz raport z ostatnich testów
npm run test:e2e:report

# Wygeneruj test automatycznie (codegen)
npm run test:e2e:codegen

# Uruchom konkretny plik
npx playwright test tests/e2e/auth/login.spec.ts

# Uruchom konkretny test
npx playwright test -g "should login with valid credentials"

# Uruchom z widoczną przeglądarką
npx playwright test --headed

# Uruchom tylko jeden test (dodaj .only)
test.only("my test", async ({ page }) => { ... });
```

## Wzorzec AAA

Wszystkie testy powinny stosować wzorzec AAA:

```typescript
test("descriptive name", async ({ page }) => {
  // Arrange - przygotowanie
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  // Act - akcja
  await loginPage.login("test@example.com", "password");

  // Assert - weryfikacja
  await expect(page).toHaveURL(/\/boards/);
});
```

## Selektory data-test-id

Wszystkie kluczowe elementy mają `data-test-id`:

| Element                  | data-test-id                  |
| ------------------------ | ----------------------------- |
| Formularz logowania      | `login-form`                  |
| Input email              | `login-email-input`           |
| Input hasło              | `login-password-input`        |
| Toggle hasła             | `login-password-input-toggle` |
| Przycisk submit          | `login-submit-button`         |
| Link rejestracji         | `signup-link`                 |
| Link przypomnienia hasła | `forgot-password-link`        |

## Debugowanie

### 1. Pause w teście

```typescript
await page.pause();
```

### 2. Screenshot

```typescript
await page.screenshot({ path: "debug.png" });
```

### 3. Console log

```typescript
page.on("console", (msg) => console.log(msg.text()));
```

### 4. Trace viewer

Po niepowodzeniu testu automatycznie zbierany jest trace:

```bash
npx playwright show-trace path/to/trace.zip
```

## Najczęstsze problemy

### ❌ "E2E_USERNAME and E2E_PASSWORD must be set"

Rozwiązanie: Dodaj zmienne do `.env`

### ❌ "Page timeout 30000ms exceeded"

Rozwiązanie: Sprawdź czy serwer dev działa (`npm run dev`)

### ❌ "Target closed"

Rozwiązanie: Uruchom z `--headed` aby zobaczyć co się dzieje

### ❌ "Element not found"

Rozwiązanie: Sprawdź czy używasz poprawnego `data-test-id`

## Następne kroki

1. Zobacz pełną dokumentację: [README.md](./README.md)
2. Przejrzyj przykładowe testy: [auth/login.spec.ts](./auth/login.spec.ts)
3. Zobacz wszystkie Page Objects: [helpers/page-objects.ts](./helpers/page-objects.ts)

## Dodatkowe zasoby

- 📚 [Dokumentacja Playwright](https://playwright.dev/)
- 🎓 [Best Practices](https://playwright.dev/docs/best-practices)
- 🏗️ [Page Object Model](https://playwright.dev/docs/pom)
