# Dokumentacja testów

Ten dokument opisuje strukturę i praktyki testowe w projekcie Definition Quest.

## Struktura folderów

```
tests/
├── unit/              # Testy jednostkowe (Vitest)
│   ├── components/    # Testy komponentów React
│   └── ...           # Testy funkcji pomocniczych, hooków
├── integration/       # Testy integracyjne (Vitest)
├── e2e/              # Testy end-to-end (Playwright)
│   └── helpers/      # Page Objects i helpers
└── __mocks__/        # Globalne mocki
```

## Testy jednostkowe (Vitest)

### Uruchamianie

```bash
# Uruchom wszystkie testy w trybie watch
npm run test:watch

# Uruchom testy jeden raz
npm test

# Uruchom testy z UI
npm run test:ui

# Uruchom testy z coverage (tylko gdy potrzebne)
npm run test:coverage
```

### Najlepsze praktyki

1. **Używaj `vi` do mockowania**
   - `vi.fn()` - tworzenie mocka funkcji
   - `vi.spyOn()` - monitorowanie istniejących funkcji
   - `vi.mock()` - mockowanie modułów

2. **Strukturyzuj testy zgodnie z AAA**
   - Arrange (przygotowanie)
   - Act (akcja)
   - Assert (sprawdzenie)

3. **Testuj komponenty React z Testing Library**
   - Używaj `render()` do renderowania komponentów
   - Używaj `screen` do znajdowania elementów
   - Używaj `userEvent` do symulacji interakcji

4. **Inline snapshots dla czytelności**

   ```typescript
   expect(data).toMatchInlineSnapshot();
   ```

5. **Używaj TypeScript**
   - Zapewnia type safety w testach
   - Łapie błędy wcześniej

### Przykład testu jednostkowego

```typescript
import { describe, it, expect, vi } from "vitest";

describe("myFunction", () => {
  it("should return expected value", () => {
    const result = myFunction(5);
    expect(result).toBe(10);
  });
});
```

### Przykład testu komponentu

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Testy E2E (Playwright)

### Uruchamianie

```bash
# Uruchom wszystkie testy e2e
npm run test:e2e

# Uruchom w trybie UI
npm run test:e2e:ui

# Uruchom w trybie debug
npm run test:e2e:debug

# Generuj testy używając codegen
npm run test:e2e:codegen

# Pokaż raport z ostatnich testów
npm run test:e2e:report
```

### Najlepsze praktyki

1. **Używaj Browser Contexts dla izolacji**

   ```typescript
   const context = await browser.newContext();
   const page = await context.newPage();
   ```

2. **Implementuj Page Object Model**
   - Centralizacja selektorów
   - Reużywalność kodu
   - Łatwiejsza konserwacja

3. **Używaj odpowiednich locatorów**
   - Preferuj role-based locators: `getByRole('button')`
   - Używaj `data-testid` dla stabilnych selektorów
   - Unikaj selektorów CSS bazujących na strukturze

4. **Visual Regression Testing**

   ```typescript
   await expect(page).toHaveScreenshot("homepage.png");
   ```

5. **Trace dla debugowania**
   - Automatycznie zbierane przy niepowodzeniu
   - `npx playwright show-trace trace.zip`

### Przykład testu e2e

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage, BoardsPage } from "./helpers/page-objects";

test("user can login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const boardsPage = new BoardsPage(page);

  // Przejdź do strony logowania
  await loginPage.goto();

  // Zaloguj używając zmiennych środowiskowych
  await loginPage.loginWithEnvCredentials();

  // Weryfikuj przekierowanie
  await loginPage.waitForSuccessfulLogin();
  await boardsPage.verifyOnBoardsPage();
});
```

Więcej przykładów w: [tests/e2e/auth/login.spec.ts](./e2e/auth/login.spec.ts)

### Przykład Page Object

```typescript
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = this.getByTestId("login-email-input");
    this.passwordInput = this.getByTestId("login-password-input");
    this.submitButton = this.getByTestId("login-submit-button");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithEnvCredentials() {
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
    }
    await this.login(email, password);
  }
}
```

Pełna dokumentacja Page Object Models: [tests/e2e/README.md](./e2e/README.md)

## Konfiguracja CI/CD

### GitHub Actions

Testy są uruchamiane automatycznie w pipeline CI/CD:

- Testy jednostkowe przy każdym push
- Testy e2e przy pull requestach do main

## Debugowanie

### Vitest

- Użyj `test.only()` do uruchomienia pojedynczego testu
- Użyj `console.log()` lub debugger w testach
- UI mode: `npm run test:ui`

### Playwright

- Debug mode: `npm run test:e2e:debug`
- Codegen mode: `npm run test:e2e:codegen`
- Trace viewer: `npx playwright show-trace`

## Coverage

Uruchom coverage tylko gdy potrzebne:

```bash
npm run test:coverage
```

Progi coverage są ustawione na 80% dla wszystkich metryk.

## Wsparcie

W razie problemów z testami:

1. Sprawdź czy wszystkie zależności są zainstalowane
2. Upewnij się że serwer deweloperski działa (dla testów e2e)
3. Sprawdź trace/screenshots w przypadku niepowodzeń e2e
4. Użyj debug mode do krokowego debugowania
