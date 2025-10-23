# Specyfikacja Techniczna – Moduł Autentykacji
## Definition Quest

---

## Spis treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Architektura interfejsu użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika backendowa](#3-logika-backendowa)
4. [System autentykacji](#4-system-autentykacji)
5. [Przepływ danych i scenariusze](#5-przepływ-danych-i-scenariusze)
6. [Kontrakt API](#6-kontrakt-api)
7. [Podsumowanie i rekomendacje](#7-podsumowanie-i-rekomendacje)

---

## 1. Wprowadzenie

### 1.1. Cel dokumentu

Niniejsza specyfikacja definiuje architekturę i implementację modułu autentykacji użytkowników w aplikacji **Definition Quest**. Moduł obejmuje rejestrację, logowanie, wylogowanie oraz odzyskiwanie hasła, wykorzystując Supabase Auth jako backend autentykacyjny w połączeniu z Astro SSR i React.

### 1.2. Zakres funkcjonalny

Zgodnie z wymaganiami PRD (US-001), moduł autentykacji musi zapewnić:

- **Rejestrację nowych użytkowników** (email + hasło)
- **Logowanie użytkowników** (email + hasło)
- **Wylogowanie** z aktywnej sesji
- **Odzyskiwanie hasła** poprzez link resetujący w email
- **Zabezpieczenie** stron i endpointów API przed dostępem niezalogowanych użytkowników (w formie middlewara, jeżeli już istnieje pomiń, jak nie to utwórz)
- **Automatyczne utworzenie profilu użytkownika** w tabeli `user_meta` po rejestracji

### 1.3. Wymagania niefunkcjonalne

- Tylko strony logowania i rejestracji są dostępne dla niezalogowanych użytkowników
- Wszystkie operacje autentykacji muszą obsługiwać błędy i wyświetlać przyjazne komunikaty
- Walidacja danych po stronie klienta i serwera
- Implementacja zgodna z zasadami dostępności (ARIA, focus-ring, kontrast)
- Wykorzystanie istniejącej infrastruktury (middleware, Supabase client, struktury katalogów)

---

## 2. Architektura interfejsu użytkownika

### 2.1. Struktura stron (Astro pages)

Moduł autentykacji wprowadza **4 nowe strony Astro** renderowane server-side:

#### 2.1.1. Strona logowania

**Lokalizacja:** `src/pages/login.astro`

**Odpowiedzialność:**
- Renderowanie formularza logowania (React component)
- Sprawdzenie stanu sesji po stronie serwera – jeśli użytkownik jest zalogowany, przekierowanie na `/dashboard` lub stronę główną
- Wyświetlenie komunikatów o sukcesie (np. po rejestracji: "Account created! Please log in.")
- Obsługa query params: `?message=...` dla komunikatów informacyjnych

**Logika server-side (Astro frontmatter):**
```typescript
// Pobierz sesję użytkownika z Supabase
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

// Jeśli użytkownik jest zalogowany, przekieruj
if (session) {
  return Astro.redirect('/dashboard');
}

// Opcjonalnie: pobierz komunikat z query params
const message = Astro.url.searchParams.get('message');
```

**Props przekazywane do komponentu React:**
- `message?: string` – komunikat informacyjny

**Layout:** `Layout.astro` (bez nawigacji użytkownika)

---

#### 2.1.2. Strona rejestracji

**Lokalizacja:** `src/pages/signup.astro`

**Odpowiedzialność:**
- Renderowanie formularza rejestracji (React component)
- Sprawdzenie stanu sesji – jeśli użytkownik jest zalogowany, przekierowanie na `/boards`
- Informacja o wymaganiach dla hasła (minimum 6 znaków)

**Logika server-side (Astro frontmatter):**
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect('/dashboard');
}
```

**Props przekazywane do komponentu React:**
- brak specjalnych props (formularz zarządza własnym stanem)

**Layout:** `Layout.astro` (bez nawigacji użytkownika)

---

#### 2.1.3. Strona żądania resetu hasła

**Lokalizacja:** `src/pages/forgot-password.astro`

**Odpowiedzialność:**
- Renderowanie formularza żądania resetu hasła (React component)
- Użytkownik podaje email, na który zostanie wysłany link resetujący
- Wyświetlenie komunikatu sukcesu po wysłaniu emaila

**Logika server-side (Astro frontmatter):**
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

// Zalogowani użytkownicy mogą też zresetować hasło
// (opcjonalnie można przekierować na stronę ustawień profilu)
```

**Props przekazywane do komponentu React:**
- brak specjalnych props

**Layout:** `Layout.astro`

---

#### 2.1.4. Strona resetowania hasła

**Lokalizacja:** `src/pages/reset-password.astro`

**Odpowiedzialność:**
- Renderowanie formularza do ustawienia nowego hasła (React component)
- Walidacja tokenu resetującego z URL (przekazanego przez Supabase w linku emailowym)
- Po pomyślnej zmianie hasła, przekierowanie na `/login?message=Password updated successfully`

**Logika server-side (Astro frontmatter):**
```typescript
// Sprawdź, czy token resetowania hasła jest obecny w URL
const token = Astro.url.searchParams.get('token');
const type = Astro.url.searchParams.get('type');

if (!token || type !== 'recovery') {
  // Brak tokenu lub nieprawidłowy typ – przekieruj na forgot-password
  return Astro.redirect('/forgot-password?message=Invalid or expired reset link');
}

// Zweryfikuj token z Supabase
const { data: { session }, error } = await Astro.locals.supabase.auth.verifyOtp({
  token_hash: token,
  type: 'recovery'
});

if (error || !session) {
  return Astro.redirect('/forgot-password?message=Invalid or expired reset link');
}

// Token jest prawidłowy – renderuj formularz
```

**Props przekazywane do komponentu React:**
- brak (komponent używa API do zmiany hasła)

**Layout:** `Layout.astro`

---

#### 2.1.5. Strona Dashboard (nowa lub rozszerzona strona główna)

**Lokalizacja:** `src/pages/dashboard.astro` lub rozszerzenie `src/pages/index.astro`

**Odpowiedzialność:**
- Główna strona aplikacji dla zalogowanych użytkowników
- Wyświetlenie listy plansz użytkownika, statystyk, opcji tworzenia nowej planszy
- **Wymaga autentykacji** – middleware lub server-side sprawdzenie sesji

**Logika server-side (Astro frontmatter):**
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect('/login?message=Please log in to continue');
}

// Pobierz dane użytkownika
const user = session.user;
```

**Layout:** `AuthenticatedLayout.astro` (rozszerzony Layout z nawigacją użytkownika)

---

### 2.2. Komponenty React (client-side interactivity)

#### 2.2.1. LoginForm

**Lokalizacja:** `src/components/auth/LoginForm.tsx`

**Odpowiedzialność:**
- Zarządzanie stanem formularza (email, password)
- Walidacja po stronie klienta (email format, hasło minimum 6 znaków)
- Wywołanie endpointu `POST /api/auth/login`
- Obsługa błędów (wyświetlenie komunikatów pod formularzem)
- Wyświetlenie linku do "Forgot password?" i "Don't have an account? Sign up"
- Loading state podczas procesu logowania
- Po sukcesie – przekierowanie na `/dashboard` lub stronę z query param `redirect`

**State:**
```typescript
{
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

**Walidacja kliencka:**
- Email: regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Password: minimum 6 znaków

**Przykładowy flow:**
1. Użytkownik wprowadza dane
2. Kliknięcie "Log in" → `isLoading = true`
3. Wywołanie `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })`
4. Odpowiedź:
   - Sukces → `window.location.href = '/dashboard'`
   - Błąd → wyświetl komunikat, `isLoading = false`

**Komponenty UI użyte:**
- `Button` (z `src/components/ui/button.tsx`)
- `Input` (do stworzenia w `src/components/ui/input.tsx` – Shadcn/ui)
- `Label` (do stworzenia w `src/components/ui/label.tsx` – Shadcn/ui)
- `Alert` (do stworzenia w `src/components/ui/alert.tsx` – Shadcn/ui dla komunikatów błędów)

**ARIA i dostępność:**
- `aria-label` na inputach
- `aria-invalid` na inputach z błędami
- `aria-describedby` łączące input z komunikatem błędu
- `focus-visible:ring` na elementach interaktywnych

---

#### 2.2.2. SignUpForm

**Lokalizacja:** `src/components/auth/SignUpForm.tsx`

**Odpowiedzialność:**
- Zarządzanie stanem formularza (email, password, displayName)
- Walidacja po stronie klienta (email, hasło min 6 znaków, displayName max 40 znaków)
- Wywołanie endpointu `POST /api/auth/signUp`
- Obsługa błędów (np. email już istnieje)
- Po sukcesie – komunikat "Account created! Please check your email for verification." + opcjonalne przekierowanie na `/login?message=...`

**State:**
```typescript
{
  email: string;
  password: string;
  displayName: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Walidacja kliencka:**
- Email: regex
- Password: minimum 6 znaków
- DisplayName: 1-40 znaków

**Flow:**
1. Użytkownik wprowadza dane
2. Kliknięcie "Sign up" → `isLoading = true`
3. Wywołanie `POST /api/auth/signUp`
4. Odpowiedź:
   - Sukces → wyświetl komunikat sukcesu lub przekieruj na `/login?message=Account created`
   - Błąd → wyświetl komunikat błędu

**Komponenty UI użyte:**
- `Button`, `Input`, `Label`, `Alert`

**ARIA i dostępność:**
- Takie same wymagania jak `LoginForm`

---

#### 2.2.3. ForgotPasswordForm

**Lokalizacja:** `src/components/auth/ForgotPasswordForm.tsx`

**Odpowiedzialność:**
- Zarządzanie stanem formularza (email)
- Wywołanie endpointu `POST /api/auth/forgot-password`
- Wyświetlenie komunikatu sukcesu: "Password reset link sent! Check your email."
- Obsługa błędów (np. email nie istnieje w bazie – ale z bezpieczeństwa zawsze pokazujemy sukces)

**State:**
```typescript
{
  email: string;
  isLoading: boolean;
  success: boolean;
  error: string | null;
}
```

**Flow:**
1. Użytkownik wprowadza email
2. Kliknięcie "Send reset link" → `isLoading = true`
3. Wywołanie `POST /api/auth/forgot-password`
4. Odpowiedź zawsze sukces (security best practice – nie ujawniamy czy email istnieje)
5. Wyświetlenie komunikatu sukcesu

**Komponenty UI użyte:**
- `Button`, `Input`, `Label`, `Alert`

---

#### 2.2.4. ResetPasswordForm

**Lokalizacja:** `src/components/auth/ResetPasswordForm.tsx`

**Odpowiedzialność:**
- Zarządzanie stanem formularza (newPassword, confirmPassword)
- Walidacja: hasło min 6 znaków, oba pola muszą być identyczne
- Wywołanie endpointu `POST /api/auth/reset-password`
- Po sukcesie – przekierowanie na `/login?message=Password updated successfully`

**State:**
```typescript
{
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  error: string | null;
}
```

**Walidacja kliencka:**
- newPassword: minimum 6 znaków
- confirmPassword: musi być identyczne z newPassword

**Flow:**
1. Użytkownik wprowadza nowe hasło (2x)
2. Kliknięcie "Reset password" → `isLoading = true`
3. Wywołanie `POST /api/auth/reset-password` (token jest automatycznie dostępny w sesji Supabase)
4. Odpowiedź:
   - Sukces → `window.location.href = '/login?message=Password updated'`
   - Błąd → wyświetl komunikat błędu

**Komponenty UI użyte:**
- `Button`, `Input`, `Label`, `Alert`

---

#### 2.2.5. UserNav (Nawigacja użytkownika)

**Lokalizacja:** `src/components/auth/UserNav.tsx`

**Odpowiedzialność:**
- Wyświetlenie informacji o zalogowanym użytkowniku (display name, avatar)
- Dropdown menu z opcjami: "Profile", "Settings", "Log out"
- Wywołanie endpointu `POST /api/auth/logout` przy kliknięciu "Log out"

**Props:**
```typescript
{
  user: {
    email: string;
    displayName: string;
    avatarUrl?: string;
  };
}
```

**Funkcjonalności:**
- Dropdown otwierany po kliknięciu na awatar/nazwę
- Opcja "Log out" → wywołanie `POST /api/auth/logout` → przekierowanie na `/login`

**Komponenty UI użyte:**
- `DropdownMenu` (do stworzenia w `src/components/ui/dropdown-menu.tsx` – Shadcn/ui)
- `Avatar` (do stworzenia w `src/components/ui/avatar.tsx` – Shadcn/ui)

---

### 2.3. Rozszerzenie Layoutów

#### 2.3.1. Layout.astro (podstawowy)

**Lokalizacja:** `src/layouts/Layout.astro`

**Zmiany:**
- Dodanie warunkowego renderowania `<UserNav>` jeśli użytkownik jest zalogowany
- Sprawdzenie sesji po stronie serwera w frontmatter

**Logika server-side:**
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
const user = session?.user;

// Jeśli user istnieje, pobierz display name z user_meta
let userProfile = null;
if (user) {
  const { data } = await Astro.locals.supabase
    .from('user_meta')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();
  
  userProfile = {
    email: user.email,
    displayName: data?.display_name,
    avatarUrl: data?.avatar_url
  };
}
```

**Props dla UserNav:**
- Przekazanie `userProfile` jako client:load prop do React component

---

#### 2.3.2. AuthenticatedLayout.astro (nowy)

**Lokalizacja:** `src/layouts/AuthenticatedLayout.astro`

**Odpowiedzialność:**
- Layout dla stron wymagających autentykacji
- Sprawdzenie sesji po stronie serwera
- Jeśli użytkownik niezalogowany → przekierowanie na `/login`
- Zawiera `<UserNav>` w headerze

**Logika server-side:**
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  const redirectUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/login?redirect=${redirectUrl}`);
}

// Pobierz profil użytkownika
const user = session.user;
const { data: userMeta } = await Astro.locals.supabase
  .from('user_meta')
  .select('display_name, avatar_url')
  .eq('id', user.id)
  .single();

const userProfile = {
  email: user.email,
  displayName: userMeta?.display_name,
  avatarUrl: userMeta?.avatar_url
};
```

**Struktura:**
```astro
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <header>
      <UserNav user={userProfile} client:load />
    </header>
    <main>
      <slot />
    </main>
    <footer>...</footer>
  </body>
</html>
```

---

### 2.4. Zabezpieczenie stron wymagających autentykacji

Wszystkie strony wymagające zalogowania (np. dashboard, boards, profile) będą:

1. **Używać `AuthenticatedLayout.astro`** – który automatycznie sprawdza sesję i przekierowuje na login
2. **Alternatywnie:** implementować własną logikę sprawdzania sesji w frontmatter strony

**Przykład dla `src/pages/dashboard.astro`:**
```astro
---
import AuthenticatedLayout from '../layouts/AuthenticatedLayout.astro';
// Reszta importów...

// AuthenticatedLayout automatycznie sprawdza sesję
// Jeśli użytkownik niezalogowany → redirect na /login
---

<AuthenticatedLayout title="Dashboard">
  <!-- Treść dashboard -->
</AuthenticatedLayout>
```

---

### 2.5. Walidacja i komunikaty błędów (UI)

#### 2.5.1. Typy błędów

**Błędy walidacji (client-side):**
- Email nieprawidłowy format
- Hasło za krótkie (< 6 znaków)
- DisplayName za długie (> 40 znaków)
- Hasła nie pasują (w ResetPasswordForm)

**Błędy serwera (API response):**
- Email już istnieje (signup)
- Nieprawidłowe dane logowania (login)
- Token resetu hasła wygasł (reset-password)
- Brak połączenia z serwerem

#### 2.5.2. Wyświetlanie komunikatów

**Inline errors (pod inputem):**
```tsx
{errors.email && (
  <p className="text-sm text-destructive" role="alert" aria-live="polite">
    {errors.email}
  </p>
)}
```

**Global errors (nad formularzem):**
```tsx
{error && (
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
  </Alert>
)}
```

**Success messages:**
```tsx
{success && (
  <Alert variant="success">
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>Account created successfully!</AlertDescription>
  </Alert>
)}
```

---

### 2.6. Najważniejsze scenariusze UX

#### 2.6.1. Scenariusz: Nowy użytkownik zakłada konto

1. Użytkownik wchodzi na stronę główną `/`
2. Widzi przycisk "Sign up"
3. Kliknięcie → przekierowanie na `/signup`
4. Wypełnienie formularza (email, password, displayName)
5. Kliknięcie "Sign up" → loading state
6. Sukces → komunikat "Account created! Please check your email for verification."
7. Opcjonalnie: automatyczne przekierowanie na `/login?message=Account created`

#### 2.6.2. Scenariusz: Użytkownik loguje się

1. Użytkownik wchodzi na `/login`
2. Wypełnia email i hasło
3. Kliknięcie "Log in" → loading state
4. Sukces → przekierowanie na `/dashboard` (lub stronę z `redirect` query param)
5. Błąd → komunikat błędu pod formularzem

#### 2.6.3. Scenariusz: Użytkownik zapomniał hasła

1. Na stronie `/login`, kliknięcie linku "Forgot password?"
2. Przekierowanie na `/forgot-password`
3. Wprowadzenie emaila
4. Kliknięcie "Send reset link" → loading state
5. Komunikat sukcesu: "Password reset link sent! Check your email."
6. Użytkownik otwiera email, klika link
7. Link prowadzi do `/reset-password?token=...&type=recovery`
8. Wprowadzenie nowego hasła (2x)
9. Kliknięcie "Reset password" → loading state
10. Sukces → przekierowanie na `/login?message=Password updated successfully`

#### 2.6.4. Scenariusz: Użytkownik próbuje wejść na chronioną stronę bez logowania

1. Użytkownik wpisuje w przeglądarce `/dashboard` (ale nie jest zalogowany)
2. `AuthenticatedLayout` sprawdza sesję → brak sesji
3. Przekierowanie na `/login?redirect=%2Fdashboard`
4. Po zalogowaniu → automatyczne przekierowanie z powrotem na `/dashboard`

#### 2.6.5. Scenariusz: Użytkownik wylogowuje się

1. Użytkownik kliknięcie na UserNav w headerze
2. Kliknięcie "Log out" w dropdown menu
3. Wywołanie `POST /api/auth/logout`
4. Przekierowanie na `/login?message=Logged out successfully`

---

## 3. Logika backendowa

### 3.1. Struktura endpointów API

Wszystkie endpointy autentykacji znajdują się w katalogu `src/pages/api/auth/`:

```
src/pages/api/auth/
├── login.ts          # POST – logowanie użytkownika
├── signUp.ts         # POST – rejestracja użytkownika
├── logout.ts         # POST – wylogowanie użytkownika
├── forgot-password.ts # POST – żądanie resetu hasła
└── reset-password.ts  # POST – ustawienie nowego hasła
```

#### 3.1.1. Wspólne cechy wszystkich endpointów

- **Format:** Astro API routes z eksportowanymi funkcjami `GET`, `POST`, etc.
- **Prerender:** `export const prerender = false` (dla endpointów dynamicznych)
- **Walidacja:** Zod schemas dla request body
- **Obsługa błędów:** Strukturalna odpowiedź JSON z kodem statusu i komunikatem
- **Response format:**
  ```typescript
  // Sukces
  { data: {...}, message?: string }
  
  // Błąd
  { error: string, details?: any }
  ```

---

### 3.2. Endpoint: POST /api/auth/login

**Lokalizacja:** `src/pages/api/auth/login.ts`

**Odpowiedzialność:**
- Walidacja danych wejściowych (email, password)
- Wywołanie `supabase.auth.signInWithPassword()`
- Zwrócenie sesji i danych użytkownika
- Obsługa błędów (nieprawidłowe dane, konto nie istnieje)

**Request body schema (Zod):**
```typescript
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

**Flow:**
1. Parsowanie i walidacja JSON body
2. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
3. Jeśli sukces:
   - Zwrócenie `{ data: { user, session }, message: 'Logged in successfully' }`
   - Status: `200`
4. Jeśli błąd:
   - Zwrócenie `{ error: error.message }`
   - Status: `401` (unauthorized) lub `400` (bad request)

**Obsługa wyjątków:**
- JSON parsing error → `400 Bad Request`
- Zod validation error → `400 Bad Request` z `details: error.flatten()`
- Supabase auth error → status z `error.status` lub domyślnie `401`

**Przykładowa implementacja (kontrakt):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parsowanie body
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Walidacja
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: result.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { email, password } = result.data;

  // 3. Wywołanie Supabase Auth
  const { data, error } = await locals.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.status || 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Sukces
  return new Response(
    JSON.stringify({ data, message: 'Logged in successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3.3. Endpoint: POST /api/auth/signUp

**Lokalizacja:** `src/pages/api/auth/signUp.ts`

**Odpowiedzialność:**
- Walidacja danych wejściowych (email, password, displayName)
- Wywołanie `supabase.auth.signUp()`
- Utworzenie rekordu w tabeli `user_meta` z displayName
- Zwrócenie informacji o utworzonym koncie
- Obsługa błędów (email już istnieje, słabe hasło)

**Request body schema (Zod):**
```typescript
const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1).max(40, 'Display name must be 1-40 characters'),
});
```

**Flow:**
1. Parsowanie i walidacja JSON body
2. Wywołanie `supabase.auth.signUp({ email, password })`
3. Jeśli sukces:
   - Pobranie `user.id` z odpowiedzi
   - Utworzenie rekordu w `user_meta`: `INSERT INTO user_meta (id, display_name) VALUES (user.id, displayName)`
   - Zwrócenie `{ data: { user }, message: 'Account created successfully' }`
   - Status: `201`
4. Jeśli błąd:
   - Email już istnieje → `{ error: 'User already exists' }` – Status: `409`
   - Inny błąd Supabase → status z `error.status` lub domyślnie `400`

**Obsługa wyjątków:**
- JSON parsing error → `400 Bad Request`
- Zod validation error → `400 Bad Request`
- Supabase auth error → odpowiedni status kod
- Błąd insertu do `user_meta` → rollback sesji (Supabase nie wspiera transakcji multi-table w prosty sposób, ale można obsłużyć przez usunięcie użytkownika z auth.users w przypadku błędu)

**Przykładowa implementacja (kontrakt):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(40),
});

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parsowanie body
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Walidacja
  const result = signUpSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: result.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { email, password, displayName } = result.data;

  // 3. Wywołanie Supabase Auth
  const { data: authData, error: authError } = await locals.supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    // Email już istnieje
    if (authError.message.includes('already registered')) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ error: authError.message }),
      { status: authError.status || 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const user = authData.user;
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'User creation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. Utworzenie rekordu w user_meta
  const { error: metaError } = await locals.supabase
    .from('user_meta')
    .insert({
      id: user.id,
      display_name: displayName,
    });

  if (metaError) {
    // Błąd utworzenia profilu – opcjonalnie można usunąć użytkownika z auth
    // (w praktyce można pozwolić na to, że user_meta utworzy się później)
    console.error('Failed to create user_meta:', metaError);
    
    // Dla MVP: kontynuujemy, profil można utworzyć później
    // Dla produkcji: rozważyć rollback lub webhook
  }

  // 5. Sukces
  return new Response(
    JSON.stringify({
      data: { user },
      message: 'Account created successfully. Please check your email for verification.',
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3.4. Endpoint: POST /api/auth/logout

**Lokalizacja:** `src/pages/api/auth/logout.ts`

**Odpowiedzialność:**
- Wywołanie `supabase.auth.signOut()`
- Usunięcie sesji użytkownika
- Zwrócenie potwierdzenia wylogowania

**Request body:** brak (lub opcjonalnie pusty JSON)

**Flow:**
1. Wywołanie `supabase.auth.signOut()`
2. Jeśli sukces:
   - Zwrócenie `{ message: 'Logged out successfully' }`
   - Status: `200`
3. Jeśli błąd:
   - Zwrócenie `{ error: error.message }`
   - Status: `500`

**Przykładowa implementacja (kontrakt):**
```typescript
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const { error } = await locals.supabase.auth.signOut();

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ message: 'Logged out successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3.5. Endpoint: POST /api/auth/forgot-password

**Lokalizacja:** `src/pages/api/auth/forgot-password.ts`

**Odpowiedzialność:**
- Walidacja emaila
- Wywołanie `supabase.auth.resetPasswordForEmail()`
- Wysłanie emaila z linkiem resetującym (obsługiwane automatycznie przez Supabase)
- Zwrócenie komunikatu sukcesu (zawsze, nawet jeśli email nie istnieje – security best practice)

**Request body schema (Zod):**
```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});
```

**Flow:**
1. Parsowanie i walidacja JSON body
2. Wywołanie `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://yourapp.com/reset-password' })`
3. Zawsze zwracaj sukces (nie ujawniaj czy email istnieje):
   - `{ message: 'Password reset link sent. Please check your email.' }`
   - Status: `200`

**Konfiguracja redirect URL:**
- Redirect URL musi być skonfigurowany w Supabase dashboard: Settings → Auth → Redirect URLs
- Dodać: `http://localhost:3000/reset-password`, `https://yourapp.com/reset-password`

**Przykładowa implementacja (kontrakt):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = forgotPasswordSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: result.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { email } = result.data;

  // Wywołanie Supabase Auth
  await locals.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  });

  // Zawsze zwracamy sukces (security best practice)
  return new Response(
    JSON.stringify({ message: 'Password reset link sent. Please check your email.' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3.6. Endpoint: POST /api/auth/reset-password

**Lokalizacja:** `src/pages/api/auth/reset-password.ts`

**Odpowiedzialność:**
- Walidacja nowego hasła
- Wywołanie `supabase.auth.updateUser({ password: newPassword })`
- Token resetujący jest automatycznie weryfikowany przez Supabase (musi być w sesji)
- Zwrócenie potwierdzenia zmiany hasła

**Request body schema (Zod):**
```typescript
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
```

**Flow:**
1. Parsowanie i walidacja JSON body
2. Sprawdzenie, czy użytkownik jest zalogowany (token resetujący tworzy tymczasową sesję)
3. Wywołanie `supabase.auth.updateUser({ password: newPassword })`
4. Jeśli sukces:
   - Zwrócenie `{ message: 'Password updated successfully' }`
   - Status: `200`
5. Jeśli błąd:
   - Token wygasł lub nieprawidłowy → `{ error: 'Invalid or expired reset token' }` – Status: `401`
   - Inne błędy → odpowiedni status kod

**Przykładowa implementacja (kontrakt):**
```typescript
import type { APIRoute } from 'astro';
import { z } from 'zod';

export const prerender = false;

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = resetPasswordSchema.safeParse(body);
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Validation failed', details: result.error.flatten() }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { newPassword } = result.data;

  // Sprawdzenie sesji (token resetujący tworzy sesję)
  const { data: { user }, error: userError } = await locals.supabase.auth.getUser();
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired reset token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Aktualizacja hasła
  const { error: updateError } = await locals.supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return new Response(
      JSON.stringify({ error: updateError.message }),
      { status: updateError.status || 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ message: 'Password updated successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
```

---

### 3.7. Aktualizacja middleware

**Lokalizacja:** `src/middleware/index.ts`

**Zmiany:**
1. Dodanie nowych publicznych endpointów do listy `PUBLIC_ENDPOINTS`:
   ```typescript
   const PUBLIC_ENDPOINTS = [
     '/api/auth/login',
     '/api/auth/signUp',
     '/api/auth/logout',
     '/api/auth/forgot-password',
     '/api/auth/reset-password',
   ];
   ```

2. Dodanie publicznych stron (opcjonalnie, jeśli middleware ma chronić również strony):
   ```typescript
   const PUBLIC_PAGES = [
     '/login',
     '/signup',
     '/forgot-password',
     '/reset-password',
   ];
   ```

3. Rozszerzenie logiki middleware o sprawdzanie stron:
   ```typescript
   // Skip authentication for public pages and endpoints
   const isPublicPage = PUBLIC_PAGES.some(page => context.url.pathname.startsWith(page));
   const isPublicEndpoint = PUBLIC_ENDPOINTS.some(endpoint => context.url.pathname.startsWith(endpoint));
   
   if (isPublicPage || isPublicEndpoint || !context.url.pathname.startsWith('/api/')) {
     return next();
   }
   ```

**Uwaga:** W przypadku Astro SSR, zabezpieczenie stron jest lepiej zrealizowane przez `AuthenticatedLayout.astro` lub bezpośrednio w frontmatter strony, niż przez middleware. Middleware powinien skupić się na zabezpieczeniu **endpointów API**.

---

### 3.8. Obsługa błędów na poziomie backendu

#### 3.8.1. Struktura odpowiedzi błędu

Wszystkie endpointy zwracają błędy w formacie:
```json
{
  "error": "Główna wiadomość błędu",
  "details": { /* opcjonalne szczegóły, np. z Zod */ }
}
```

#### 3.8.2. Kody statusu HTTP

| Kod | Znaczenie | Użycie |
|-----|-----------|--------|
| 200 | OK | Sukces (GET, POST logout, forgot-password) |
| 201 | Created | Sukces (POST signUp) |
| 400 | Bad Request | Błąd walidacji, nieprawidłowy JSON |
| 401 | Unauthorized | Nieprawidłowe dane logowania, token wygasł |
| 409 | Conflict | Email już istnieje (signUp) |
| 500 | Internal Server Error | Błąd serwera, błąd Supabase |

#### 3.8.3. Logowanie błędów

- Wszystkie błędy serwera (status >= 500) powinny być logowane do konsoli lub zewnętrznego systemu logowania
- Błędy użytkownika (400, 401, 409) mogą być logowane opcjonalnie dla celów audytu

**Przykład:**
```typescript
if (error.status >= 500) {
  console.error('[AUTH ERROR]', error.message, error);
}
```

---

### 3.9. Aktualizacja typów (DTO)

**Lokalizacja:** `src/types.ts`

**Nowe typy do dodania:**

```typescript
/**
 * Auth DTOs ──────────────────────────────────────────────────────────
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface AuthResponse {
  data?: {
    user: {
      id: string;
      email: string;
    };
    session?: {
      access_token: string;
      refresh_token: string;
    };
  };
  message?: string;
  error?: string;
}
```

---

## 4. System autentykacji

### 4.1. Wykorzystanie Supabase Auth

#### 4.1.1. Konfiguracja Supabase Auth

**Wymagane ustawienia w Supabase dashboard:**

1. **Auth Providers:**
   - Email/Password: włączony
   - Opcjonalnie: OAuth providers (Google, GitHub) – dla przyszłych rozszerzeń

2. **Email Templates:**
   - Confirm signup: dostosowanie szablonu emaila z linkiem weryfikacyjnym
   - Reset password: dostosowanie szablonu z linkiem resetującym
   - Magic link: wyłączony (nie używamy w MVP)

3. **Redirect URLs:**
   - Development: `http://localhost:3000/reset-password`
   - Production: `https://yourapp.com/reset-password`
   - Site URL: `http://localhost:3000` (dev), `https://yourapp.com` (prod)

4. **Email confirmation:**
   - Enable email confirmations: włączony (użytkownik musi potwierdzić email przed logowaniem)
   - Secure email change: włączony

5. **Password requirements:**
   - Minimum length: 6 znaków (zgodne z walidacją klienta)

#### 4.1.2. Supabase Client w Astro

**Istniejąca konfiguracja:** `src/db/supabase.client.ts`

- Singleton instancja Supabase client
- Używanie przez middleware i endpointy przez `context.locals.supabase`
- Client automatycznie zarządza session cookies

**Zmienne środowiskowe:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 4.2. Zarządzanie sesjami

#### 4.2.1. Session storage

Supabase Auth przechowuje sesję w **HTTP-only cookies** automatycznie:
- Cookie name: `sb-<project-id>-auth-token`
- Zawiera: access token, refresh token
- HTTP-only: true (zabezpieczenie przed XSS)
- Secure: true (tylko HTTPS w produkcji)
- SameSite: Lax

#### 4.2.2. Session lifecycle

1. **Login:** `signInWithPassword()` → utworzenie sesji → cookie zapisany w przeglądarce
2. **Refresh:** Automatyczne odświeżanie tokenu przez Supabase client przed wygaśnięciem
3. **Logout:** `signOut()` → usunięcie sesji → cookie usunięty

#### 4.2.3. Pobieranie sesji w Astro

**W middleware:**
```typescript
const { data: { session } } = await context.locals.supabase.auth.getSession();
```

**W stronie Astro (frontmatter):**
```typescript
const { data: { session } } = await Astro.locals.supabase.auth.getSession();
```

**W endpoincie API:**
```typescript
const { data: { user }, error } = await locals.supabase.auth.getUser();
```

---

### 4.3. Zabezpieczenie endpointów API

#### 4.3.1. Middleware (istniejący)

**Lokalizacja:** `src/middleware/index.ts`

**Działanie:**
- Sprawdza wszystkie requesty do `/api/*`
- Jeśli endpoint nie jest w `PUBLIC_ENDPOINTS`, wymaga autentykacji
- Wywołuje `supabase.auth.getUser()` → jeśli brak użytkownika → `401 Unauthorized`
- Dodaje `user` do `context.locals` dla chronionych endpointów

**Aktualizacja dla nowych endpointów:**
- Dodanie endpointów autentykacji do `PUBLIC_ENDPOINTS` (login, signUp, forgot-password, reset-password)
- Opcjonalnie: endpoint logout może być publiczny lub chroniony (w MVP może być publiczny)

#### 4.3.2. Przykład zabezpieczenia endpointu

**Przykład: `src/pages/api/boards/index.ts` (tworzenie planszy):**

```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  // Middleware już sprawdził autentykację
  // user jest dostępny w locals.user
  
  const user = locals.user;
  if (!user) {
    // To nie powinno się zdarzyć, bo middleware już to sprawdził
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Logika tworzenia planszy z owner_id = user.id
  // ...
};
```

---

### 4.4. Zabezpieczenie stron (SSR)

#### 4.4.1. AuthenticatedLayout

**Główna metoda zabezpieczenia stron** – wszystkie strony wymagające logowania używają `AuthenticatedLayout.astro`:

```astro
---
// src/layouts/AuthenticatedLayout.astro
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  const redirectUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/login?redirect=${redirectUrl}`);
}

const user = session.user;
// Pobierz profil użytkownika z user_meta...
---

<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <header>
      <UserNav user={userProfile} client:load />
    </header>
    <main>
      <slot />
    </main>
  </body>
</html>
```

#### 4.4.2. Alternatywna metoda: Sprawdzanie w stronie

Dla stron, które nie używają `AuthenticatedLayout`, sprawdzenie sesji w frontmatter:

```astro
---
// src/pages/boards/[id].astro
const { data: { session } } = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect('/login');
}

// Reszta logiki...
---
```

---

### 4.5. Obsługa tokenów i cookies

#### 4.5.1. Access token i refresh token

Supabase Auth automatycznie zarządza tokenami:
- **Access token:** JWT z krótkim czasem życia (domyślnie 1 godzina)
- **Refresh token:** token do odświeżania access token (domyślnie 30 dni)

Tokeny są przechowywane w HTTP-only cookie, więc **nie są dostępne z poziomu JavaScript** (bezpieczeństwo).

#### 4.5.2. Automatyczne odświeżanie sesji

Supabase client automatycznie odświeża access token przed wygaśnięciem, używając refresh token. Nie wymaga to dodatkowej implementacji.

#### 4.5.3. Ręczne zarządzanie cookies (opcjonalnie)

W przypadku potrzeby manualnego ustawienia cookies (np. dla custom session storage), można użyć `Astro.cookies`:

```typescript
// Ustawienie cookie
Astro.cookies.set('session_id', sessionId, {
  httpOnly: true,
  secure: import.meta.env.PROD,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 dni
});

// Pobranie cookie
const sessionId = Astro.cookies.get('session_id')?.value;
```

**Uwaga:** Dla Supabase Auth nie jest to potrzebne, ponieważ zarządza cookies automatycznie.

---

### 4.6. Weryfikacja emaila

#### 4.6.1. Flow weryfikacji

1. Użytkownik rejestruje się (`POST /api/auth/signUp`)
2. Supabase wysyła email z linkiem weryfikacyjnym
3. Użytkownik klika link → przekierowanie na stronę konfigurowaną w Supabase (np. `/email-confirmed`)
4. Strona `/email-confirmed.astro` wyświetla komunikat sukcesu i link do logowania

#### 4.6.2. Konfiguracja redirect URL dla email confirmation

**W Supabase dashboard:**
- Settings → Auth → Email Templates → Confirm signup
- Change redirect URL: `{{ .SiteURL }}/email-confirmed`

**Nowa strona:** `src/pages/email-confirmed.astro`

```astro
---
// src/pages/email-confirmed.astro
import Layout from '../layouts/Layout.astro';
---

<Layout title="Email Confirmed">
  <div class="container">
    <h1>Email confirmed!</h1>
    <p>Your email has been successfully verified. You can now log in.</p>
    <a href="/login">Go to Login</a>
  </div>
</Layout>
```

#### 4.6.3. Wymuszenie weryfikacji emaila przed logowaniem

**Opcjonalnie:** Supabase Auth może być skonfigurowany tak, aby nie pozwolić na logowanie bez weryfikacji emaila:

**W Supabase dashboard:**
- Settings → Auth → Email → "Enable email confirmations" = true

Jeśli ta opcja jest włączona, próba logowania bez weryfikacji zwróci błąd: `"Email not confirmed"`.

**Obsługa w endpoincie login:**
```typescript
if (error && error.message.includes('Email not confirmed')) {
  return new Response(
    JSON.stringify({
      error: 'Please verify your email before logging in. Check your inbox for the confirmation link.',
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
```

---

### 4.7. Rate limiting i bezpieczeństwo

#### 4.7.1. Rate limiting (opcjonalne dla MVP)

Dla produkcji, zaleca się implementację rate limitingu na endpointach autentykacji:
- Login: max 5 prób na 15 minut na IP
- SignUp: max 3 rejestracje na godzinę na IP
- Forgot password: max 3 requesty na godzinę na email

**Implementacja:** Można użyć biblioteki `rate-limiter-flexible` lub Cloudflare Rate Limiting.

#### 4.7.2. CSRF protection

Astro automatycznie obsługuje CSRF protection dla formularzy poprzez origin checking w middleware.

Dla dodatkowego bezpieczeństwa, można zaimplementować CSRF tokens:
- Generowanie tokenu w formularzu (hidden input)
- Walidacja tokenu w endpoincie

**Uwaga:** Dla MVP z Supabase Auth, origin checking jest wystarczające.

#### 4.7.3. XSS i SQL Injection

- **XSS:** Supabase przechowuje tokeny w HTTP-only cookies → brak dostępu z JS
- **SQL Injection:** Supabase SDK używa prepared statements → automatyczna ochrona
- **Input validation:** Zod schemas zapewniają walidację danych wejściowych

#### 4.7.4. Password security

- **Hashing:** Supabase Auth automatycznie hashuje hasła (bcrypt)
- **Minimum length:** 6 znaków (można zwiększyć do 8-12 dla lepszego bezpieczeństwa)
- **Password strength checker:** opcjonalnie można dodać w formularzu rejestracji (komponent React z visual feedback)

---

## 5. Przepływ danych i scenariusze

### 5.1. Diagram przepływu rejestracji

```
[User] → [SignUpForm (React)] → POST /api/auth/signUp
                                        ↓
                        Supabase Auth: signUp(email, password)
                                        ↓
                                  auth.users created
                                        ↓
                         Insert into user_meta (display_name)
                                        ↓
                        Email verification sent (Supabase)
                                        ↓
                      Response: { data: { user }, message }
                                        ↓
              [SignUpForm] → Display success → Redirect to /login
```

### 5.2. Diagram przepływu logowania

```
[User] → [LoginForm (React)] → POST /api/auth/login
                                        ↓
                    Supabase Auth: signInWithPassword(email, password)
                                        ↓
                          Session created → Cookie set
                                        ↓
                      Response: { data: { user, session } }
                                        ↓
              [LoginForm] → window.location.href = '/dashboard'
                                        ↓
                    [Dashboard] → AuthenticatedLayout → Render
```

### 5.3. Diagram przepływu odzyskiwania hasła

```
[User] → [ForgotPasswordForm] → POST /api/auth/forgot-password
                                        ↓
                   Supabase Auth: resetPasswordForEmail(email)
                                        ↓
                    Email sent with reset link (Supabase)
                                        ↓
                      Response: { message: 'Link sent' }
                                        ↓
         [ForgotPasswordForm] → Display success message
                                        ↓
            [User clicks email link] → /reset-password?token=xxx&type=recovery
                                        ↓
            [ResetPasswordPage] → Verify token → Render ResetPasswordForm
                                        ↓
       [ResetPasswordForm] → POST /api/auth/reset-password (newPassword)
                                        ↓
                    Supabase Auth: updateUser({ password })
                                        ↓
                      Response: { message: 'Password updated' }
                                        ↓
        [ResetPasswordForm] → window.location.href = '/login?message=...'
```

### 5.4. Diagram przepływu zabezpieczenia strony

```
[User] → Request /dashboard
            ↓
   [AuthenticatedLayout.astro] → getSession()
            ↓
      Session exists?
       /          \
     Yes           No
      ↓             ↓
  Render page   Redirect to /login?redirect=/dashboard
      ↓
   [User logs in] → Redirect to /dashboard (from redirect param)
```

---

## 6. Kontrakt API

### 6.1. POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  },
  "message": "Logged in successfully"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid login credentials"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "email": ["Invalid email format"],
      "password": ["Password must be at least 6 characters"]
    }
  }
}
```

---

### 6.2. POST /api/auth/signUp

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response (201 Created):**
```json
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

**Response (409 Conflict):**
```json
{
  "error": "User with this email already exists"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "displayName": ["Display name must be 1-40 characters"]
    }
  }
}
```

---

### 6.3. POST /api/auth/logout

**Request:** (pusty body lub brak)

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to log out"
}
```

---

### 6.4. POST /api/auth/forgot-password

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset link sent. Please check your email."
}
```

**Note:** Zawsze zwraca sukces, nawet jeśli email nie istnieje (security best practice).

---

### 6.5. POST /api/auth/reset-password

**Request:**
```json
{
  "newPassword": "newpassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password updated successfully"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid or expired reset token"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "newPassword": ["Password must be at least 6 characters"]
    }
  }
}
```

---

## 7. Podsumowanie i rekomendacje

### 7.1. Podsumowanie architektury

Moduł autentykacji dla **Definition Quest** wykorzystuje:

1. **Frontend (Astro + React):**
   - 4 strony Astro: login, signup, forgot-password, reset-password
   - 5 komponentów React: LoginForm, SignUpForm, ForgotPasswordForm, ResetPasswordForm, UserNav
   - 2 layouty: Layout (public), AuthenticatedLayout (protected)
   - Komponenty UI z Shadcn/ui: Button, Input, Label, Alert, DropdownMenu, Avatar

2. **Backend (Astro API routes + Supabase):**
   - 5 endpointów API: login, signUp, logout, forgot-password, reset-password
   - Walidacja Zod dla wszystkich request bodies
   - Middleware chroniący endpointy API przed dostępem niezalogowanych użytkowników
   - Supabase Auth jako backend autentykacyjny

3. **Baza danych (PostgreSQL via Supabase):**
   - Tabela `auth.users` (zarządzana przez Supabase Auth)
   - Tabela `user_meta` (display_name, avatar_url)
   - RLS policies dla user_meta

4. **Zabezpieczenia:**
   - HTTP-only cookies dla session storage
   - Zod validation na wszystkich endpointach
   - CSRF protection (origin checking)
   - Email verification (opcjonalne)
   - Rate limiting (rekomendowane dla produkcji)

---

### 7.2. Kluczowe decyzje architektoniczne

1. **Astro SSR dla renderowania stron:**
   - Pozwala na sprawdzenie sesji po stronie serwera przed renderowaniem
   - Lepsze SEO i performance niż SPA

2. **React dla formularzy:**
   - Interaktywność, walidacja kliencka, zarządzanie stanem
   - Wykorzystanie istniejących komponentów Shadcn/ui

3. **Supabase Auth jako backend:**
   - Kompleksowe rozwiązanie (auth, email, session management)
   - Minimalizuje potrzebę custom implementacji
   - Row Level Security dla zabezpieczenia danych

4. **Middleware dla API, Layout dla stron:**
   - Middleware chroni endpointy API
   - AuthenticatedLayout chroni strony wymagające logowania
   - Rozdzielenie odpowiedzialności

5. **Zod dla walidacji:**
   - Type-safe validation
   - Spójność między klientem a serwerem
   - Automatyczne generowanie błędów walidacji

---

### 7.3. Rekomendacje dla implementacji

#### 7.3.1. Kolejność implementacji

1. **Faza 1: Backend API**
   - Implementacja endpointów: login, signUp, logout
   - Aktualizacja middleware (PUBLIC_ENDPOINTS)
   - Testy endpointów (Postman/Thunder Client)

2. **Faza 2: UI Components**
   - Stworzenie komponentów Shadcn/ui: Input, Label, Alert
   - Implementacja formularzy: LoginForm, SignUpForm
   - Testy formularzy (standalone)

3. **Faza 3: Strony Astro**
   - Implementacja stron: login.astro, signup.astro
   - Integracja formularzy z endpointami
   - Testy E2E (rejestracja → logowanie)

4. **Faza 4: Odzyskiwanie hasła**
   - Implementacja endpointów: forgot-password, reset-password
   - Implementacja stron i formularzy
   - Konfiguracja email templates w Supabase
   - Testy E2E (forgot → reset)

5. **Faza 5: Zabezpieczenie stron**
   - Implementacja AuthenticatedLayout
   - Aktualizacja istniejących stron (dashboard, boards)
   - Implementacja UserNav
   - Testy zabezpieczeń (próba dostępu bez logowania)

6. **Faza 6: Polish**
   - Stylowanie, animacje, error handling
   - Dostępność (ARIA, focus management)
   - Responsywność (desktop-first, ale nie ignorować mobile)

#### 7.3.2. Testy

**Unit tests:**
- Walidacja Zod schemas
- Logika komponentów React (React Testing Library)

**Integration tests:**
- Endpointy API (wywołanie z fake request)
- Formularze z mock API

**E2E tests:**
- Playwright lub Cypress
- Scenariusze: rejestracja, logowanie, wylogowanie, reset hasła

#### 7.3.3. Dokumentacja

Po implementacji, zaktualizować:
- README.md: instrukcje konfiguracji Supabase Auth
- CHANGELOG.md: nowe funkcjonalności autentykacji
- .env.example: zmienne środowiskowe dla Supabase

---

### 7.4. Potencjalne rozszerzenia (poza MVP)

1. **OAuth providers:**
   - Google, GitHub, Microsoft
   - Konfiguracja w Supabase dashboard
   - Dodatkowe przyciski w LoginForm/SignUpForm

2. **Two-Factor Authentication (2FA):**
   - Supabase Auth wspiera TOTP
   - Dodatkowa strona dla konfiguracji 2FA w ustawieniach profilu

3. **Magic links (passwordless login):**
   - Alternatywa dla email + password
   - Endpoint `POST /api/auth/magic-link`

4. **Social login:**
   - Integracja z OAuth providers
   - Automatyczne utworzenie profilu z danych social

5. **Session management:**
   - Lista aktywnych sesji w ustawieniach profilu
   - Możliwość wylogowania z wszystkich urządzeń

6. **Email change:**
   - Endpoint `POST /api/auth/change-email`
   - Weryfikacja nowego emaila

7. **Account deletion:**
   - Endpoint `DELETE /api/auth/account`
   - Usunięcie wszystkich danych użytkownika (GDPR compliance)

---

### 7.5. Checklist implementacyjny

#### Backend
- [ ] Endpoint `POST /api/auth/login`
- [ ] Endpoint `POST /api/auth/signUp` z utworzeniem user_meta
- [ ] Endpoint `POST /api/auth/logout`
- [ ] Endpoint `POST /api/auth/forgot-password`
- [ ] Endpoint `POST /api/auth/reset-password`
- [ ] Aktualizacja middleware (PUBLIC_ENDPOINTS)
- [ ] Dodanie typów Auth do `src/types.ts`

#### Frontend - Komponenty UI
- [ ] `Input` component (Shadcn/ui)
- [ ] `Label` component (Shadcn/ui)
- [ ] `Alert` component (Shadcn/ui)
- [ ] `DropdownMenu` component (Shadcn/ui)
- [ ] `Avatar` component (Shadcn/ui)

#### Frontend - Komponenty Auth
- [ ] `LoginForm.tsx`
- [ ] `SignUpForm.tsx`
- [ ] `ForgotPasswordForm.tsx`
- [ ] `ResetPasswordForm.tsx`
- [ ] `UserNav.tsx`

#### Frontend - Strony
- [ ] `login.astro`
- [ ] `signup.astro`
- [ ] `forgot-password.astro`
- [ ] `reset-password.astro`
- [ ] `email-confirmed.astro`

#### Layouts
- [ ] Aktualizacja `Layout.astro` (warunkowy UserNav)
- [ ] Nowy `AuthenticatedLayout.astro`

#### Zabezpieczenia
- [ ] Aktualizacja istniejących stron do używania AuthenticatedLayout
- [ ] Testy zabezpieczeń (próba dostępu bez logowania)
- [ ] Konfiguracja Supabase Auth (redirect URLs, email templates)

#### Dokumentacja i testy
- [ ] Testy jednostkowe (Zod schemas)
- [ ] Testy integracyjne (endpointy API)
- [ ] Testy E2E (rejestracja, logowanie, reset hasła)
- [ ] Aktualizacja README.md
- [ ] Aktualizacja CHANGELOG.md

---

## Koniec specyfikacji

**Data utworzenia:** 2025-10-23  
**Wersja:** 1.0  
**Autor:** AI Assistant (Claude Sonnet 4.5)  
**Projekt:** Definition Quest  
**Stack:** Astro 5, React 19, TypeScript 5, Supabase, Tailwind 4

---

