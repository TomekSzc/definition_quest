# 🚀 E2E Testing Setup Guide - Quick Reference

Przewodnik krok po kroku do skonfigurowania testów E2E z automatycznym czyszczeniem bazy danych.

## 📋 Checklist

- [ ] Utwórz oddzielny projekt Supabase dla testów
- [ ] Pobierz klucze Supabase z Dashboard (URL i anon key)
- [ ] Utwórz plik `.env.test` w głównym katalogu projektu
- [ ] Utwórz użytkownika testowego w bazie danych
- [ ] Uruchom migracje w bazie testowej
- [ ] Uruchom testy: `npm run test:e2e`

## 🛠️ Krok po kroku

### 1. Utwórz oddzielną bazę testową

**Opcja A: Nowy projekt Supabase (zalecane)**

1. Przejdź do [Supabase Dashboard](https://app.supabase.com/)
2. Kliknij **New Project**
3. Nazwij projekt: `definition-quest-test`
4. Wybierz region i hasło
5. Czekaj na utworzenie projektu (2-3 minuty)

**Opcja B: Lokalna instancja Supabase**

```bash
# Zainstaluj Supabase CLI
npm install -g supabase

# Uruchom lokalnie
npx supabase start

# Skopiuj credentials z output
```

### 2. Pobierz credentials z Supabase Dashboard

1. Przejdź do swojego projektu testowego
2. **Settings** → **API**
3. Skopiuj:
   - **Project URL** (SUPABASE_URL)
   - **anon public** key (SUPABASE_KEY)

### 3. Utwórz plik `.env.test`

W głównym katalogu projektu utwórz plik `.env.test`:

```env
# Supabase Test Environment
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Test User (WYMAGANE dla czyszczenia bazy danych)
E2E_USERNAME=test@example.com
E2E_PASSWORD=TestPassword123!

# Base URL
BASE_URL=http://localhost:3000
```

### 4. Uruchom migracje

```bash
# Jeśli używasz lokalnego Supabase
npx supabase db reset

# Jeśli używasz zdalnego projektu Supabase
# 1. Przejdź do Dashboard → Database → Migrations
# 2. Zastosuj migracje z folderu supabase/migrations/
```

### 5. Utwórz użytkownika testowego

**Opcja A: Przez Dashboard**

1. **Authentication** → **Users** → **Add User**
2. Email: `test@example.com`
3. Password: `TestPassword123!`
4. Confirm email automatically: ✅

**Opcja B: Przez SQL**

```sql
-- W Supabase Dashboard → SQL Editor
-- Lub przez psql jeśli lokalna instancja

-- Utwórz użytkownika
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);
```

### 6. Sprawdź gitignore

Upewnij się, że `.env.test` jest w `.gitignore`:

```gitignore
# Environment files
.env
.env.test
.env.local
.env.production
```

### 7. Zainstaluj przeglądarki Playwright

```bash
npx playwright install chromium
```

### 8. Uruchom testy!

```bash
# Podstawowe uruchomienie
npm run test:e2e

# Tryb UI (interaktywny)
npm run test:e2e:ui

# Tryb debug
npm run test:e2e:debug
```

## ✅ Weryfikacja

### Sprawdź czy wszystko działa

Po uruchomieniu testów powinieneś zobaczyć:

```
✅ Loaded environment from: .env.test
Running 8 tests using 1 worker
...
8 passed (15.2s)

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

### Sprawdź bazę danych

Po testach sprawdź bazę - dane testowe powinny być usunięte:

```sql
-- Powinno zwrócić 0 lub niewiele rekordów
SELECT COUNT(*) FROM boards WHERE owner_id = (
  SELECT id FROM auth.users WHERE email = 'test@example.com'
);
```

## 🔍 Troubleshooting

### Problem: "Loaded environment from: .env.test" nie pojawia się

**Rozwiązanie:**
1. Sprawdź czy `.env.test` jest w głównym katalogu projektu
2. Sprawdź czy plik nie ma błędnej składni
3. Uruchom ponownie: `npm run test:e2e`

### Problem: "E2E_USERNAME or E2E_PASSWORD not found"

**Rozwiązanie:**
1. Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` są w `.env.test`
2. Upewnij się, że użytkownik testowy istnieje w bazie danych
3. Hasło musi być poprawne - użytkownik będzie logowany w cleanup

### Problem: Testy failują z "Target closed"

**Rozwiązanie:**
1. Sprawdź czy serwer dev działa: `npm run dev`
2. Sprawdź czy `BASE_URL` w `.env.test` jest poprawny
3. Zwiększ timeout w `playwright.config.ts`

### Problem: "Authentication failed" podczas testów

**Rozwiązanie:**
1. Sprawdź czy użytkownik testowy istnieje w bazie
2. Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` są poprawne
3. Sprawdź czy email jest confirmed (w auth.users)

### Problem: Cleanup nie działa

**Rozwiązanie:**
1. Sprawdź logi - powinieneś zobaczyć "🧹 Starting E2E Global Teardown..."
2. Jeśli nie widzisz logów, sprawdź `playwright.config.ts` - powinien zawierać:
   ```typescript
   globalTeardown: "./tests/e2e/global-teardown.ts",
   ```
3. Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` są poprawne
4. Upewnij się, że użytkownik testowy może się zalogować

## 📚 Następne kroki

Po skonfigurowaniu środowiska:

1. **Przeczytaj dokumentację:**
   - [E2E-TEARDOWN.md](./E2E-TEARDOWN.md) - Szczegóły o cleanup
   - [README.md](./README.md) - Pełna dokumentacja E2E
   - [QUICKSTART.md](./QUICKSTART.md) - Szybki start

2. **Przejrzyj przykłady:**
   - `tests/e2e/auth/login.spec.ts` - Przykładowe testy
   - `tests/e2e/helpers/page-objects.ts` - Page Objects

3. **Napisz swoje testy:**
   - Użyj `npm run test:e2e:codegen` do generowania
   - Stosuj Page Object Model
   - Testuj kluczowe flow aplikacji

## 🎯 Dobre praktyki

### ✅ DO

- Używaj ODRĘBNEJ bazy testowej
- Commituj `.gitignore` z `.env.test`
- Regularnie uruchamiaj testy lokalnie
- Używaj Page Object Model
- Testuj kluczowe user flows

### ❌ DON'T

- NIE używaj produkcyjnej bazy dla testów
- NIE commituj `.env.test` do repo
- NIE udostępniaj credentials testowych publicznie
- NIE pomijaj cleanup (może prowadzić do flaky tests)
- NIE testuj szczegółów implementacji

## 🆘 Potrzebujesz pomocy?

- 📖 [E2E-TEARDOWN.md](./E2E-TEARDOWN.md) - Szczegółowa dokumentacja
- 📖 [Playwright Docs](https://playwright.dev/)
- 📖 [Supabase Docs](https://supabase.com/docs)

---

**Happy Testing! 🚀**

