# E2E Global Teardown - Dokumentacja

Dokumentacja dotycząca czyszczenia bazy danych Supabase po testach E2E.

## Spis treści

- [Czym jest Global Teardown?](#czym-jest-global-teardown)
- [Jak działa?](#jak-działa)
- [Konfiguracja](#konfiguracja)
- [Bezpieczeństwo](#bezpieczeństwo)
- [Troubleshooting](#troubleshooting)

## Czym jest Global Teardown?

Global Teardown to skrypt, który uruchamia się automatycznie **po zakończeniu wszystkich testów E2E**. Jego zadaniem jest wyczyszczenie bazy danych testowej z danych utworzonych podczas testów, zapewniając:

- ✅ Czystą bazę danych przed kolejnym uruchomieniem testów
- ✅ Izolację testów między uruchomieniami
- ✅ Brak "śmieci" testowych w bazie danych

## Jak działa?

### 1. Uruchamianie

Global Teardown jest skonfigurowany w `playwright.config.ts`:

```typescript
export default defineConfig({
  globalTeardown: "./tests/e2e/global-teardown.ts",
  // ... rest of config
});
```

### 2. Proces czyszczenia

Skrypt wykonuje następujące kroki:

1. **Walidacja** - sprawdza czy zmienne środowiskowe są ustawione
2. **Logowanie** - loguje się jako użytkownik testowy (E2E_USERNAME/E2E_PASSWORD)
3. **Autoryzacja** - używa klucza publicznego (SUPABASE_KEY) z sesją użytkownika
4. **Czyszczenie danych** - usuwa dane w odpowiedniej kolejności (respektując RLS):
   - `scores` (wyniki testowe)
   - `ai_requests` (zapytania AI)
   - `pairs` (pary term-definition)
   - `boards` (tablice gier)
   - `user_meta` (metadane użytkownika)
5. **Wylogowanie** - kończy sesję użytkownika testowego

### 3. Kolejność usuwania

Dane są usuwane w odpowiedniej kolejności ze względu na foreign keys:

```
scores (zależy od board_id i user_id)
  ↓
ai_requests (zależy od user_id)
  ↓
pairs (zależy od board_id)
  ↓
boards (zależy od owner_id)
  ↓
user_meta (zależy od id)
```

## Konfiguracja

### Krok 1: Utwórz plik `.env.test`

W głównym katalogu projektu utwórz plik `.env.test`:

```bash
# Supabase Test Environment (ODRĘBNA baza testowa!)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here

# Test User Credentials (WYMAGANE dla czyszczenia bazy danych)
E2E_USERNAME=test@example.com
E2E_PASSWORD=your_test_password

# Base URL
BASE_URL=http://localhost:3000
```

### Krok 2: Pobierz Supabase Keys

Klucze znajdziesz w Supabase Dashboard:

1. Przejdź do swojego projektu w [Supabase Dashboard](https://app.supabase.com/)
2. **Settings** → **API**
3. Skopiuj:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_KEY)

### Krok 3: Użyj ODRĘBNEJ bazy testowej

**KRYTYCZNE:** Nigdy nie używaj produkcyjnej bazy danych dla testów E2E!

Opcje:

#### Opcja A: Oddzielny projekt Supabase (zalecane)

Utwórz nowy projekt Supabase dedykowany tylko dla testów:

1. Dashboard → **New Project**
2. Nazwa: `your-project-test` lub `your-project-e2e`
3. Uruchom te same migracje co na produkcji
4. Użyj credentials z tego projektu w `.env.test`

#### Opcja B: Lokalna instancja Supabase

Użyj lokalnego Supabase CLI:

```bash
# Uruchom lokalny Supabase
npx supabase start

# Użyj lokalnych credentials w .env.test
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbG...  # anon key z output supabase start
```

### Krok 4: Utwórz użytkownika testowego

W bazie testowej utwórz użytkownika:

```sql
-- W Supabase Dashboard → Authentication → Add User
-- Lub przez SQL:
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'test@example.com',
  crypt('your_password', gen_salt('bf')),
  now()
);
```

Lub użyj Supabase Dashboard:

- Authentication → Users → Add User
- Email: `test@example.com`
- Password: (twoje hasło testowe)
- Confirm email automatically: ✅

## Bezpieczeństwo

### ✅ Dobre praktyki

- **Używaj ODRĘBNEJ bazy testowej** - nigdy produkcyjnej!
- **Nie commituj `.env.test`** - dodaj do `.gitignore`
- **Test user password** trzymaj w bezpiecznym miejscu
- **Regularnie zmieniaj** hasło użytkownika testowego

### ❌ Czego NIE robić

- ❌ Nie używaj produkcyjnej bazy danych
- ❌ Nie commituj `.env.test` do repozytorium
- ❌ Nie udostępniaj credentials testowych publicznie
- ❌ Nie używaj tej samej bazy co dla developmentu

### .gitignore

Upewnij się, że `.env.test` jest w `.gitignore`:

```gitignore
# Environment files
.env
.env.test
.env.local
.env.production
```

## Strategie czyszczenia

### Strategia 1: Czyszczenie dla użytkownika testowego (domyślna)

Ta strategia jest **bezpieczna** i usuwa tylko dane utworzone przez użytkownika testowego:

```typescript
// W global-teardown.ts (już zaimplementowane)
const testUser = authUser.users.find((user) => user.email === testUserEmail);
// ... usuwa tylko dane tego użytkownika
```

**Zalety:**

- ✅ Bezpieczne - nie usuwa innych danych
- ✅ Szybkie - usuwa tylko potrzebne rekordy
- ✅ Idealne dla współdzielonej bazy testowej

### Strategia 2: Czyszczenie WSZYSTKICH danych (niebezpieczna)

Ta strategia usuwa **WSZYSTKIE** dane z tabel (zakomentowana domyślnie):

```typescript
// W global-teardown.ts - ODKOMENTUJ TYLKO DLA DEDYKOWANEJ BAZY TESTOWEJ!
await supabase.from("scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
await supabase.from("ai_requests").delete().neq("id", "00000000-0000-0000-0000-000000000000");
// ... etc
```

**Użyj TYLKO jeśli:**

- ✅ Masz dedykowaną bazę testową
- ✅ Jesteś pewien, że to nie jest produkcja
- ✅ Chcesz całkowicie czyścić bazę po każdym uruchomieniu

## Troubleshooting

### Problem: "E2E_USERNAME or E2E_PASSWORD not found"

**Przyczyna:** Brak credentials użytkownika testowego w zmiennych środowiskowych

**Rozwiązanie:**

1. Sprawdź czy `.env.test` istnieje w głównym katalogu projektu
2. Dodaj `E2E_USERNAME=...` i `E2E_PASSWORD=...` do `.env.test`
3. Upewnij się, że Playwright wczytuje `.env.test` (sprawdź `playwright.config.ts`)
4. Sprawdź czy użytkownik testowy istnieje w bazie danych

### Problem: "SUPABASE_URL not found"

**Przyczyna:** Brak URL Supabase w zmiennych środowiskowych

**Rozwiązanie:**

1. Sprawdź czy `.env.test` zawiera `SUPABASE_URL`
2. Sprawdź czy wartość to poprawny URL (https://xxx.supabase.co)

### Problem: "Error deleting [table]: permission denied"

**Przyczyna:** Użytkownik testowy nie ma uprawnień do usuwania danych lub RLS blokuje operację

**Rozwiązanie:**

1. Sprawdź czy użytkownik testowy jest właścicielem danych (owner_id)
2. Sprawdź RLS policies w Supabase Dashboard
3. Upewnij się, że użytkownik może się zalogować (sprawdź E2E_PASSWORD)
4. Sprawdź czy `SUPABASE_KEY` jest poprawny

### Problem: Cleanup nie działa, ale nie ma błędów

**Przyczyna:** Może nie być danych do usunięcia lub użytkownik testowy nie istnieje

**Rozwiązanie:**

1. Sprawdź logi: `npm run test:e2e` - powinieneś zobaczyć "🧹 Starting E2E Global Teardown..."
2. Sprawdź czy użytkownik testowy istnieje w bazie
3. Sprawdź czy `E2E_USERNAME` w `.env.test` zgadza się z email użytkownika w bazie

### Problem: "Target closed" podczas teardown

**Przyczyna:** Timeout lub problem z połączeniem do Supabase

**Rozwiązanie:**

1. Sprawdź czy `SUPABASE_URL` jest poprawny
2. Zwiększ timeout w `playwright.config.ts`
3. Sprawdź połączenie internetowe

### Problem: Chcę zobaczyć szczegółowe logi

**Rozwiązanie:** Uruchom testy z verbose logging:

```bash
DEBUG=pw:api npm run test:e2e
```

Lub dodaj dodatkowe console.log w `global-teardown.ts`.

## Weryfikacja działania

### Test 1: Sprawdź czy teardown się uruchamia

```bash
npm run test:e2e
```

Poszukaj w output:

```
🧹 Starting E2E Global Teardown...
✅ E2E Global Teardown completed successfully
```

### Test 2: Sprawdź bazę danych przed i po

1. **Przed testami:** Sprawdź ile rekordów w tabeli `boards`:

   ```sql
   SELECT COUNT(*) FROM boards WHERE owner_id = 'test_user_uuid';
   ```

2. **Po testach:** Sprawdź ponownie - powinno być 0

### Test 3: Uruchom testy dwukrotnie

```bash
npm run test:e2e
npm run test:e2e
```

Drugie uruchomienie powinno przejść bez problemów - dowód, że cleanup działa.

## Integracja z CI/CD

### GitHub Actions

Przykładowa konfiguracja dla GitHub Actions:

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Create .env.test
        run: |
          echo "SUPABASE_URL=${{ secrets.TEST_SUPABASE_URL }}" >> .env.test
          echo "SUPABASE_KEY=${{ secrets.TEST_SUPABASE_KEY }}" >> .env.test
          echo "E2E_USERNAME=${{ secrets.E2E_USERNAME }}" >> .env.test
          echo "E2E_PASSWORD=${{ secrets.E2E_PASSWORD }}" >> .env.test

      - name: Run E2E Tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

**Secrets do dodania w GitHub:**

- `TEST_SUPABASE_URL`
- `TEST_SUPABASE_KEY`
- `E2E_USERNAME`
- `E2E_PASSWORD`

## Zaawansowane użycie

### Opcjonalne usunięcie użytkownika testowego

W `global-teardown.ts` jest zakomentowany kod do usunięcia użytkownika:

```typescript
// Odkomentuj jeśli chcesz usuwać użytkownika po każdym teście
const { error: deleteUserError } = await supabase.auth.admin.deleteUser(testUser.id);
```

**Kiedy to użyć:**

- Jeśli tworzysz nowego użytkownika testowego w każdym teście
- Jeśli testujesz rejestrację użytkowników

**Kiedy NIE używać:**

- Jeśli używasz tego samego użytkownika testowego wielokrotnie (szybsze)

### Czyszczenie selektywne

Możesz modyfikować `global-teardown.ts`, aby czyścić tylko określone tabele:

```typescript
// Przykład: Usuń tylko boards i pairs, zostaw scores dla analizy
await supabase.from("pairs").delete().in("board_id", boardIds);
await supabase.from("boards").delete().eq("owner_id", testUser.id);
// Nie usuwaj scores
```

## Przydatne komendy

```bash
# Uruchom testy E2E z teardown
npm run test:e2e

# Uruchom testy w trybie UI (teardown nadal działa)
npm run test:e2e:ui

# Zobacz raport (teardown info w konsoli przed raportem)
npm run test:e2e:report

# Debug (możesz zobaczyć logi teardown)
npm run test:e2e:debug
```

## Dodatkowe zasoby

- [Playwright Global Setup/Teardown](https://playwright.dev/docs/test-global-setup-teardown)
- [Supabase Auth API](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Playwright Configuration](https://playwright.dev/docs/test-configuration)

## FAQ

**Q: Czy teardown uruchamia się po każdym teście?**  
A: Nie, **globalTeardown** uruchamia się raz po WSZYSTKICH testach. Jeśli potrzebujesz cleanup po każdym teście, użyj `test.afterEach()`.

**Q: Czy mogę wyłączyć teardown?**  
A: Tak, zakomentuj `globalTeardown` w `playwright.config.ts`. Ale pamiętaj, że wtedy dane testowe będą się kumulować.

**Q: Co jeśli testy failują, czy teardown się wykona?**  
A: Tak, globalTeardown wykonuje się zawsze, nawet jeśli testy failują.

**Q: Czy cleanup działa lokalnie i na CI?**  
A: Tak, działa wszędzie gdzie uruchamiasz `npm run test:e2e` i masz skonfigurowane zmienne środowiskowe.

**Q: Jak szybki jest cleanup?**  
A: Zwykle 1-3 sekundy, w zależności od ilości danych do usunięcia.

---

**Ostatnia aktualizacja:** 2025-11-20  
**Wersja:** 1.0.0
