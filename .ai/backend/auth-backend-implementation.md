# Implementacja Backendu Uwierzytelniania

## Podsumowanie

Pomyślnie zaimplementowano kompletny backend uwierzytelniania dla Definition Quest zgodnie ze specyfikacją w `auth-spec.md`.

## Zaimplementowane Komponenty

### 1. Schematy Walidacji (`src/lib/validation/auth.ts`)

- `LoginSchema` - waliduje email i hasło dla logowania
- `SignUpSchema` - waliduje email, hasło i displayName dla rejestracji
- `ForgotPasswordSchema` - waliduje email dla żądania resetowania hasła
- `ResetPasswordSchema` - waliduje accessToken, refreshToken i newPassword dla resetowania hasła

**Uwaga**: `ResetPasswordSchema` wymaga trzech pól: `accessToken`, `refreshToken` oraz `newPassword` (nie tylko samego hasła jak w pierwotnym planie).

### 2. Endpointy API

Wszystkie endpointy uwierzytelniania sprawdzają flagę funkcjonalności `auth` i zwracają kod 503 jeśli jest wyłączona.

#### POST /api/auth/login

- Uwierzytelnia użytkownika przy użyciu emaila i hasła
- Zwraca dane użytkownika i tokeny sesji
- Obsługuje błąd niezweryfikowanego emaila
- Kody statusu: 200 (sukces), 400 (walidacja), 401 (nieprawidłowe dane), 403 (email niezweryfikowany), 503 (funkcja wyłączona)

#### POST /api/auth/signUp

- Rejestruje nowego użytkownika z emailem, hasłem i nazwą wyświetlaną
- Tworzy rekord auth.users przez Supabase Auth
- Tworzy rekord user_meta z nazwą wyświetlaną
- Automatycznie wysyła email weryfikacyjny
- Graceful degradation: błąd tworzenia user_meta jest logowany ale nie przerywa procesu rejestracji
- Kody statusu: 201 (utworzono), 400 (walidacja), 409 (email już istnieje), 503 (funkcja wyłączona)

#### POST /api/auth/logout

- Wylogowuje bieżącego użytkownika
- Czyści ciasteczka sesji
- Może być wywołany bez uwierzytelnienia
- Kody statusu: 200 (sukces), 500 (błąd serwera), 503 (funkcja wyłączona)

#### POST /api/auth/forgot-password

- Wysyła link do resetowania hasła na email użytkownika
- Zawsze zwraca sukces (best practice bezpieczeństwa)
- Dynamicznie konstruuje URL przekierowania na podstawie pochodzenia żądania
- Kody statusu: 200 (sukces), 400 (walidacja), 503 (funkcja wyłączona)

#### POST /api/auth/reset-password

- Resetuje hasło używając tokenów z linku emailowego
- Przyjmuje accessToken i refreshToken w ciele żądania
- Najpierw ustawia sesję używając `setSession()`, następnie aktualizuje hasło
- Tokeny są weryfikowane przez Supabase podczas ustawiania sesji
- Kody statusu: 200 (sukces), 400 (walidacja), 422 (nieprawidłowy/wygasły token), 503 (funkcja wyłączona)

**Uwaga**: Implementacja różni się od pierwotnego planu - endpoint nie polega na istniejącej sesji, lecz przyjmuje tokeny jawnie w request body i używa ich do utworzenia sesji przed aktualizacją hasła.

#### POST /api/auth/refresh-token

- Odświeża access token używając refresh tokena
- Zwraca nowy access token i refresh token
- Pozwala na przedłużenie sesji użytkownika bez ponownego logowania
- Kody statusu: 200 (sukces), 400 (walidacja), 401 (nieprawidłowy/wygasły token), 503 (funkcja wyłączona)

### 3. Mapowania Błędów (`src/lib/utils/api-response.ts`)

Dodano zunifikowane odpowiedzi błędów:

- `EMAIL_ALREADY_EXISTS` - 409 (email już istnieje)
- `INVALID_CREDENTIALS` - 401 (nieprawidłowe dane logowania)
- `EMAIL_NOT_CONFIRMED` - 403 (email niezweryfikowany)
- `INVALID_RESET_TOKEN` - 401 (nieprawidłowy token resetowania)
- `INVALID_REFRESH_TOKEN` - 401 (nieprawidłowy refresh token)
- `USER_CREATION_FAILED` - 500 (błąd tworzenia użytkownika)

### 4. Definicje Typów (`src/types.ts`)

Dodano DTO dla uwierzytelniania:

- `LoginRequest` - email, password
- `SignUpRequest` - email, password, displayName
- `ForgotPasswordRequest` - email
- `ResetPasswordRequest` - accessToken, refreshToken, newPassword
- `RefreshTokenRequest` - refreshToken
- `AuthUserDTO` - id, email
- `AuthSessionDTO` - accessToken, refreshToken
- `AuthResponse` - data (user, session), message

### 5. Aktualizacje Middleware (`src/middleware/index.ts`)

Middleware zostało rozszerzone aby:

- Zawsze próbować uwierzytelnić dla endpointów API
- Ustawić `locals.user` jeśli uwierzytelnienie się powiedzie (nawet dla publicznych endpointów)
- Pozwalać publicznym endpointom na kontynuację bez uwierzytelnienia
- Wymuszać uwierzytelnienie dla chronionych endpointów
- Wspierać wzorce dostępu zarówno uwierzytelnionego jak i anonimowego

Endpointy publiczne:

- `/api/auth/login`
- `/api/auth/signUp`
- `/api/auth/logout`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/refresh-token`

## Przykłady Kontraktu API

### Logowanie

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Odpowiedź 200 OK
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  },
  "message": "Logged in successfully"
}
```

### Rejestracja

```bash
POST /api/auth/signUp
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "Jan Kowalski"
}

# Odpowiedź 201 Created
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com"
    }
  },
  "message": "Account created successfully. Please check your email for verification."
}
```

### Wylogowanie

```bash
POST /api/auth/logout

# Odpowiedź 200 OK
{
  "message": "Logged out successfully"
}
```

### Zapomniałem Hasła

```bash
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

# Odpowiedź 200 OK
{
  "message": "Password reset link sent. Please check your email."
}
```

### Resetowanie Hasła

```bash
POST /api/auth/reset-password
Content-Type: application/json

{
  "accessToken": "token_z_linku_email",
  "refreshToken": "refresh_token_z_linku_email",
  "newPassword": "nowehaslo123"
}

# Odpowiedź 200 OK
{
  "message": "Password updated successfully"
}

# Odpowiedź 422 Unprocessable Entity (nieprawidłowy token)
{
  "error": "Token nieważny lub wygasł ..."
}
```

**Uwaga**: Endpoint resetowania hasła wymaga jawnego przekazania tokenów otrzymanych z linku emailowego (accessToken i refreshToken), nie polega na istniejącej sesji.

### Odświeżanie Tokena

```bash
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "twoj_refresh_token"
}

# Odpowiedź 200 OK
{
  "data": {
    "session": {
      "accessToken": "nowy_jwt_token",
      "refreshToken": "nowy_refresh_token"
    }
  },
  "message": "Token refreshed successfully"
}
```

## Funkcje Bezpieczeństwa

1. **HTTP-only Cookies**: Tokeny sesji przechowywane bezpiecznie przez Supabase
2. **Walidacja Zod**: Wszystkie dane wejściowe walidowane po stronie serwera
3. **Obsługa Błędów**: Spójne odpowiedzi błędów, brak wycieku informacji
4. **Wymagania Hasła**: Minimum 6 znaków (wymuszane przez walidację)
5. **Weryfikacja Email**: Automatyczny email weryfikacyjny wysyłany przy rejestracji
6. **Best Practices Bezpieczeństwa**:
   - Forgot password zawsze zwraca sukces (nie ujawnia czy email istnieje)
   - Ogólne komunikaty błędów dla nieprawidłowych danych logowania
7. **Feature Flags**: Wszystkie endpointy sprawdzają flagę `auth` przed wykonaniem

## Rekomendacje Testowe

### Testowanie Manualne z Klientem REST

1. **Przepływ Rejestracji**

   ```bash
   POST http://localhost:4321/api/auth/signUp
   {
     "email": "test@example.com",
     "password": "test123",
     "displayName": "Użytkownik Testowy"
   }
   ```

2. **Przepływ Logowania**

   ```bash
   POST http://localhost:4321/api/auth/login
   {
     "email": "test@example.com",
     "password": "test123"
   }
   ```

3. **Przepływ Resetowania Hasła**

   ```bash
   # Żądanie resetu
   POST http://localhost:4321/api/auth/forgot-password
   {
     "email": "test@example.com"
   }

   # Sprawdź email dla linku resetującego
   # Kliknij link (otwiera /reset-password?access_token=xxx&refresh_token=yyy&type=recovery)
   # Wyciągnij tokeny z URL

   # Resetuj hasło
   POST http://localhost:4321/api/auth/reset-password
   {
     "accessToken": "token_z_url",
     "refreshToken": "refresh_token_z_url",
     "newPassword": "nowehaslo123"
   }
   ```

4. **Przepływ Wylogowania**

   ```bash
   POST http://localhost:4321/api/auth/logout
   ```

5. **Przepływ Odświeżania Tokena**

   ```bash
   # Najpierw zaloguj się aby uzyskać refresh token
   POST http://localhost:4321/api/auth/login
   {
     "email": "test@example.com",
     "password": "test123"
   }
   # Zapisz refreshToken z odpowiedzi

   # Użyj refresh tokena aby uzyskać nowy access token
   POST http://localhost:4321/api/auth/refresh-token
   {
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

### Przypadki Brzegowe do Przetestowania

- Logowanie z niezweryfikowanym emailem
- Rejestracja z istniejącym emailem
- Nieprawidłowy format emaila
- Hasło zbyt krótkie (< 6 znaków)
- Nazwa wyświetlana zbyt długa (> 40 znaków)
- Wygasły token resetowania
- Resetowanie hasła bez tokenów
- Nieprawidłowy lub wygasły refresh token
- Refresh token od innego użytkownika
- Dostęp do chronionego endpointu bez uwierzytelnienia
- Wywołanie endpointów gdy flaga `auth` jest wyłączona

## Wymagana Konfiguracja Supabase

Przed testowaniem upewnij się, że Supabase jest skonfigurowany:

1. **Szablony Email** (w Supabase Dashboard → Authentication → Email Templates)
   - Szablon potwierdzenia rejestracji
   - Szablon resetowania hasła

2. **URL Przekierowań** (w Supabase Dashboard → Authentication → URL Configuration)
   - Dodaj URL deweloperski: `http://localhost:4321/reset-password`
   - Dodaj URL produkcyjny: `https://twojadomena.com/reset-password`

3. **Potwierdzenie Email** (w Supabase Dashboard → Authentication → Settings)
   - Włącz "Confirm email" jeśli chcesz wymagać weryfikacji emaila przed logowaniem

## Kolejne Kroki (Implementacja Frontendu)

1. Utworzyć strony Astro:
   - `src/pages/login.astro`
   - `src/pages/signup.astro`
   - `src/pages/forgot-password.astro`
   - `src/pages/reset-password.astro`

2. Utworzyć komponenty React:
   - `src/components/auth/LoginForm.tsx`
   - `src/components/auth/SignUpForm.tsx`
   - `src/components/auth/ForgotPasswordForm.tsx`
   - `src/components/auth/ResetPasswordForm.tsx`
   - `src/components/auth/UserNav.tsx`

3. Utworzyć komponenty UI (Shadcn/ui):
   - Input, Label, Alert, DropdownMenu, Avatar

4. Utworzyć layouty:
   - `src/layouts/AuthenticatedLayout.astro` (dla chronionych stron)

5. Zabezpieczyć istniejące strony:
   - Zaktualizować strony dashboard/board aby używały AuthenticatedLayout

## Utworzone/Zmodyfikowane Pliki

### Utworzone Pliki

- `src/lib/validation/auth.ts` - Schematy walidacji
- `src/pages/api/auth/login.ts` - Endpoint logowania
- `src/pages/api/auth/signUp.ts` - Endpoint rejestracji
- `src/pages/api/auth/logout.ts` - Endpoint wylogowania
- `src/pages/api/auth/forgot-password.ts` - Endpoint zapomnienia hasła
- `src/pages/api/auth/reset-password.ts` - Endpoint resetowania hasła
- `src/pages/api/auth/refresh-token.ts` - Endpoint odświeżania tokena

### Zmodyfikowane Pliki

- `src/lib/utils/api-response.ts` - Dodano mapowania błędów uwierzytelniania
- `src/types.ts` - Dodano DTO uwierzytelniania
- `src/middleware/index.ts` - Zaktualizowano aby wspierać publiczne endpointy auth i elastyczne uwierzytelnianie

## Uwagi

- Legacy endpointy (`login.temporary.ts`, `signIn.temporary.ts`) mogą zostać usunięte po implementacji frontendu
- Middleware teraz wspiera hybrydowe uwierzytelnianie: publiczne endpointy nadal mogą uzyskać dostęp do `locals.user` jeśli użytkownik jest uwierzytelniony
- Resetowanie hasła wymaga:
  1. Wyciągnięcia tokenów (access_token i refresh_token) z linku emailowego
  2. Jawnego przekazania tych tokenów w request body do endpointu /api/auth/reset-password
  3. Endpoint używa tych tokenów do utworzenia sesji przed aktualizacją hasła
- Endpoint odświeżania tokena pozwala na przedłużenie sesji bez ponownego logowania
- Wszystkie endpointy stosują się do istniejących wzorców kodu dla spójności
- Wszystkie endpointy sprawdzają feature flag `auth` przed wykonaniem
- Cała obsługa błędów używa wzorca throw/catch dla lepszej organizacji kodu
- Błąd tworzenia user_meta podczas rejestracji jest logowany ale nie przerywa procesu (graceful degradation)
- Kod zawiera jeden polski komunikat błędu w `reset-password.ts` (linia 54): "Token nieważny lub wygasł"
