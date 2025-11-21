# Środowisko testowe - Definition Quest

Projekt został skonfigurowany z kompleksowym środowiskiem testowym obejmującym testy jednostkowe, integracyjne oraz end-to-end.

## 🚀 Szybki start

### Uruchom testy jednostkowe

```bash
# Tryb watch (automatyczne uruchamianie przy zmianach)
npm run test:watch

# Jednorazowe uruchomienie
npm test

# Interfejs UI
npm run test:ui

# Z coverage (tylko gdy potrzebne)
npm run test:coverage
```

### Uruchom testy E2E

```bash
# Podstawowe uruchomienie
npm run test:e2e

# Interfejs UI
npm run test:e2e:ui

# Tryb debug (krok po kroku)
npm run test:e2e:debug

# Generowanie testów (codegen)
npm run test:e2e:codegen

# Pokaż raport
npm run test:e2e:report
```

## 📦 Zainstalowane narzędzia

### Vitest - Testy jednostkowe i integracyjne

- **vitest** - framework do testów jednostkowych
- **@vitest/ui** - interfejs użytkownika dla testów
- **jsdom** - symulacja środowiska DOM
- **@testing-library/react** - testowanie komponentów React
- **@testing-library/jest-dom** - dodatkowe matchery dla DOM
- **@testing-library/user-event** - symulacja interakcji użytkownika
- **happy-dom** - alternatywa dla jsdom (szybsza)

### Playwright - Testy E2E

- **@playwright/test** - framework do testów end-to-end
- **Chromium** - przeglądarka do testów (zgodnie z wytycznymi)

## 📁 Struktura testów

```
tests/
├── unit/                      # Testy jednostkowe
│   ├── components/           # Testy komponentów React
│   │   └── Example.test.tsx  # Przykładowy test komponentu
│   └── example.test.ts       # Przykładowy test jednostkowy
├── integration/              # Testy integracyjne
│   └── example-api.test.ts   # Przykładowy test integracyjny
├── e2e/                      # Testy end-to-end
│   ├── helpers/              # Page Objects i helpers
│   │   └── page-objects.ts   # Przykładowe Page Objects
│   └── example.spec.ts       # Przykładowy test e2e
└── __mocks__/                # Globalne mocki
    └── example-mock.ts       # Przykładowe mocki
```

## ⚙️ Pliki konfiguracyjne

### vitest.config.ts

Konfiguracja Vitest z następującymi ustawieniami:

- Environment: `jsdom` (dla testowania komponentów React)
- Setup file: `vitest.setup.ts`
- Globals: włączone (globalne funkcje testowe)
- Coverage: V8 provider z progami 80%
- Alias: `@/*` wskazuje na `./src/*`

### vitest.setup.ts

Plik setup wykonywany przed każdym testem:

- Rozszerzenie `expect` o matchers z `@testing-library/jest-dom`
- Automatyczne czyszczenie po testach (`cleanup`)
- Mocki dla `window.matchMedia`, `IntersectionObserver`, `ResizeObserver`

### playwright.config.ts

Konfiguracja Playwright:

- Test directory: `./tests/e2e`
- Tylko przeglądarka Chromium (zgodnie z wytycznymi)
- Trace, screenshots i video tylko przy niepowodzeniu
- Automatyczne uruchamianie serwera dev przed testami
- Browser contexts dla izolacji środowiska testowego
- **Global Teardown** - automatyczne czyszczenie bazy danych po testach

### tsconfig.test.json

Konfiguracja TypeScript dla testów:

- Rozszerza główny `tsconfig.json`
- Dodaje typy dla Vitest i Testing Library

## 🎯 Najlepsze praktyki

### Testy jednostkowe (Vitest)

#### 1. Używaj obiektu `vi` do mockowania

```typescript
import { vi } from "vitest";

// Mock funkcji
const mockFn = vi.fn();

// Spy na istniejącą funkcję
const spy = vi.spyOn(object, "method");

// Mock modułu
vi.mock("./module", () => ({
  myFunction: vi.fn(),
}));
```

#### 2. Strukturyzuj testy zgodnie z AAA (Arrange-Act-Assert)

```typescript
it("should do something", () => {
  // Arrange - przygotowanie
  const input = 5;

  // Act - akcja
  const result = myFunction(input);

  // Assert - sprawdzenie
  expect(result).toBe(10);
});
```

#### 3. Testuj komponenty React z Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle user interaction', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button'));

  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

#### 4. Używaj inline snapshots

```typescript
expect(data).toMatchInlineSnapshot(`
  {
    "id": 1,
    "name": "Test",
  }
`);
```

### Konfiguracja testów E2E

#### Wymagane zmienne środowiskowe

Utwórz plik `.env.test` w głównym katalogu projektu:

```env
# Supabase Test Environment (ODRĘBNA baza testowa!)
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_KEY=your_test_anon_key

# Test User Credentials (WYMAGANE dla czyszczenia bazy danych)
E2E_USERNAME=test@example.com
E2E_PASSWORD=your_test_password

# Base URL
BASE_URL=http://localhost:3000
```

**WAŻNE:**

- ⚠️ **Używaj ODRĘBNEJ bazy testowej, NIGDY produkcyjnej!**
- 🔑 `E2E_USERNAME` i `E2E_PASSWORD` są wymagane dla automatycznego czyszczenia bazy danych
- 👤 Użytkownik testowy musi istnieć w bazie danych
- 🔒 Nie commituj pliku `.env.test` do repozytorium

#### Global Teardown - Automatyczne czyszczenie bazy danych

Po zakończeniu wszystkich testów E2E automatycznie uruchamia się cleanup, który usuwa dane testowe:

```
🧹 Starting E2E Global Teardown...
   Logging in as test user: test@example.com
   ✅ Logged in successfully (ID: uuid...)
   ✅ Deleted scores for test user
   ✅ Deleted ai_requests for test user
   ✅ Deleted pairs for 3 board(s)
   ✅ Deleted boards for test user
   ✅ Deleted user_meta for test user
✅ E2E Global Teardown completed successfully
```

Więcej informacji: [tests/e2e/E2E-TEARDOWN.md](./tests/e2e/E2E-TEARDOWN.md)

### Testy E2E (Playwright)

#### 1. Implementuj Page Object Model

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

#### 2. Używaj Browser Contexts dla izolacji

```typescript
test("isolated test", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  // ... test code ...

  await context.close();
});
```

#### 3. Wykorzystaj Visual Regression Testing

```typescript
await expect(page).toHaveScreenshot("homepage.png", {
  fullPage: true,
  maxDiffPixels: 100,
});
```

#### 4. Używaj odpowiednich locatorów

```typescript
// ✅ Dobre - role-based
await page.getByRole("button", { name: "Submit" });

// ✅ Dobre - data-testid
await page.getByTestId("submit-button");

// ❌ Złe - CSS selector bazujący na strukturze
await page.locator("div > button:nth-child(2)");
```

## 🔍 Debugowanie

### Vitest

1. Użyj `test.only()` do uruchomienia pojedynczego testu
2. Użyj `console.log()` lub `debugger` w testach
3. Uruchom UI mode: `npm run test:ui`
4. Użyj VS Code debugger z konfiguracją dla Vitest

### Playwright

1. Debug mode: `npm run test:e2e:debug`
2. Codegen mode: `npm run test:e2e:codegen`
3. Trace viewer: `npx playwright show-trace trace.zip`
4. Screenshots i video są automatycznie zapisywane przy niepowodzeniu

## 📊 Coverage

Uruchom coverage tylko gdy potrzebne:

```bash
npm run test:coverage
```

Raporty coverage:

- Konsola: tekst w terminalu
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`

Progi coverage (80% dla wszystkich metryk):

- Lines: 80%
- Functions: 80%
- Branches: 80%
- Statements: 80%

## 🔄 CI/CD

### GitHub Actions

Workflow `.github/workflows/test.yml` uruchamia:

**Job 1: Unit Tests**

- Instalacja zależności
- Uruchomienie testów jednostkowych
- Generowanie coverage
- Upload coverage do Codecov

**Job 2: E2E Tests**

- Instalacja zależności
- Instalacja przeglądarki Chromium
- Uruchomienie testów e2e
- Upload raportów i traces jako artifacts

Testy uruchamiane są:

- Przy każdym push do `main` i `develop`
- Przy każdym pull request do `main` i `develop`

## 📚 Dodatkowe zasoby

### Dokumentacja

- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Wskazówki

- Zobacz `tests/README.md` dla szczegółowej dokumentacji
- Zobacz `tests/e2e/E2E-TEARDOWN.md` dla dokumentacji czyszczenia bazy danych 🆕
- Sprawdź przykładowe testy w folderze `tests/`
- Użyj `test:e2e:codegen` do generowania testów e2e

## ❓ FAQ

### Jak uruchomić konkretny test?

```bash
# Vitest
npm test tests/unit/example.test.ts

# Playwright
npm run test:e2e -- example.spec.ts
```

### Jak wyłączyć konkretny test?

```typescript
// Vitest
it.skip("skipped test", () => {});

// Playwright
test.skip("skipped test", async ({ page }) => {});
```

### Jak uruchomić tylko jeden test?

```typescript
// Vitest
it.only("only this test", () => {});

// Playwright
test.only("only this test", async ({ page }) => {});
```

### Jak dodać nowy test?

1. Utwórz plik z rozszerzeniem `.test.ts` lub `.spec.ts`
2. Umieść go w odpowiednim folderze (`unit`, `integration`, lub `e2e`)
3. Importuj potrzebne narzędzia
4. Napisz testy zgodnie z przykładami

### Gdzie znajdę więcej przykładów?

- `tests/unit/example.test.ts` - podstawowy test jednostkowy
- `tests/unit/components/Example.test.tsx` - test komponentu React
- `tests/e2e/example.spec.ts` - test e2e z różnymi scenariuszami
- `tests/e2e/helpers/page-objects.ts` - przykłady Page Objects

## 🎉 Gotowe!

Środowisko testowe jest w pełni skonfigurowane i gotowe do użycia. Możesz rozpocząć pisanie testów dla swojej aplikacji!

Powodzenia! 🚀
