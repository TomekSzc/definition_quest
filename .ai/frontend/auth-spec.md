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

**Lokalizacja:** `src/pages/index.astro` (główna strona `/`)

**Odpowiedzialność:**

- Renderowanie strony logowania przez komponent React `LoginPage`
- Obsługa query params: `?return=...` dla przekierowania po zalogowaniu
- Przekierowanie zalogowanych użytkowników odbywa się po stronie React w komponencie `ProtectedRoute`

**Logika server-side (Astro frontmatter):**

```typescript
export const prerender = false;
```

**Przekazywany komponent:**

- `<LoginPage client:load />` – renderuje `AuthForm` z opcjami nawigacji do signup i forgot-password

**Layout:** `Layout.astro` (podstawowy layout bez sesji)

**Routing:**

- `Routes.Login = "/"`

---

#### 2.1.2. Strona rejestracji

**Lokalizacja:** `src/pages/signup.astro`

**Odpowiedzialność:**

- Renderowanie strony rejestracji przez komponent React `SignUpPage`
- Informacja o wymaganiach dla hasła (minimum 6 znaków + powtórz hasło)
- Przekierowanie zalogowanych użytkowników odbywa się po stronie React w komponencie `ProtectedRoute`

**Logika server-side (Astro frontmatter):**

```typescript
export const prerender = false;
```

**Przekazywany komponent:**

- `<SignUpPage client:load />` – renderuje `SignUpForm` z walidacją client-side

**Layout:** `Layout.astro` (podstawowy layout)

**Routing:**

- `Routes.SignUp = "/signup"`

---

#### 2.1.3. Strona żądania resetu hasła

**Lokalizacja:** `src/pages/forgot-password.astro`

**Odpowiedzialność:**

- Renderowanie strony przez komponent React `ForgotPasswordPage`
- Użytkownik podaje email, na który zostanie wysłany link resetujący
- Wyświetlenie komunikatu sukcesu przez toast (globalnie)

**Logika server-side (Astro frontmatter):**

```typescript
export const prerender = false;
```

**Przekazywany komponent:**

- `<ForgotPasswordPage client:load />` – renderuje `ForgotPasswordForm`

**Layout:** `Layout.astro`

**Routing:**

- `Routes.ForgotPassword = "/forgot-password"`

---

#### 2.1.4. Strona resetowania hasła

**Lokalizacja:** `src/pages/reset-password.astro`

**Odpowiedzialność:**

- Renderowanie strony przez komponent React `ResetPasswordPage`
- Wydobycie tokenów z URL hash fragment (przekazanych przez Supabase w linku emailowym)
- Po pomyślnej zmianie hasła, automatyczne przekierowanie na `/` (login)

**Logika server-side (Astro frontmatter):**

```typescript
export const prerender = false;
```

**Przekazywany komponent:**

- `<ResetPasswordPage client:load />` – renderuje `ResetPasswordForm` po walidacji tokenów

**Implementacja w ResetPasswordPage:**

```typescript
// Tokeny są w URL hash: #access_token=...&refresh_token=...
const hash = window.location.hash.substring(1);
const params = new URLSearchParams(hash);
const accessToken = params.get("access_token");
const refreshToken = params.get("refresh_token");

// Jeśli brak tokenów, przekieruj na /forgot-password po 2 sekundach
```

**Props przekazywane do ResetPasswordForm:**

- `accessToken: string`
- `refreshToken: string`

**Layout:** `Layout.astro`

**Routing:**

- `Routes.ResetPassword = "/reset-password"`

---

#### 2.1.5. Strony chronione (Boards)

**Lokalizacja:** `src/pages/boards.astro`, `src/pages/my-boards.astro`, `src/pages/played.astro`

**Odpowiedzialność:**

- Strony dla zalogowanych użytkowników
- Wyświetlenie list plansz (publiczne, własne, rozegrane)
- **Wymaga autentykacji** – sprawdzenie przez komponent React `ProtectedRoute`

**Logika server-side (Astro frontmatter):**

```typescript
export const prerender = false;
```

**Przekazywane komponenty:**

- `<BoardsPage client:load />` dla `/boards`
- `<MyBoardsPage client:load />` dla `/my-boards`
- `<BoardsPlayedPage client:load />` dla `/played`

**Zabezpieczenie:**

- Każdy z tych komponentów jest opakowany w `<ProtectedRoute>` w komponencie `Providers`
- `ProtectedRoute` sprawdza stan autentykacji z Redux store
- Przekierowanie na `/?return=<current_path>` jeśli użytkownik nie jest zalogowany

**Layout:** `Layout.astro` (podstawowy layout)

**Routing:**

- `Routes.Boards = "/boards"`
- `Routes.MyBoards = "/my-boards"`
- `Routes.MyPlayedBoards = "/played"`

---

### 2.2. Komponenty React (client-side interactivity)

#### 2.2.1. LoginPage i AuthForm

**Lokalizacja:** 
- `src/components/pages/LoginPage.tsx` (page wrapper)
- `src/components/forms/AuthForm.tsx` (formularz logowania)

**Odpowiedzialność LoginPage:**

- Renderowanie tytułu "Definition quest"
- Renderowanie `AuthForm`
- Linki do "Zarejestruj się" i "Zapomniałeś hasła?"
- Stylowanie layoutu strony logowania

**Odpowiedzialność AuthForm:**

- Zarządzanie stanem formularza przez `react-hook-form` z `zodResolver`
- Walidacja po stronie klienta przez `LoginSchema` (email format, hasło minimum 6 znaków)
- Wywołanie mutacji RTK Query `useLoginMutation()`
- Obsługa query param `?return=...` dla przekierowania po zalogowaniu
- Loading state podczas procesu logowania
- Po sukcesie – przekierowanie na adres z `return` lub domyślnie `/boards`

**State (react-hook-form):**

```typescript
{
  email: string;
  password: string;
}
// + formState.errors, isLoading z RTK Query
```

**Flow:**

1. Użytkownik wprowadza dane
2. Walidacja onBlur przez Zod schema
3. Kliknięcie "Zaloguj" → `isLoading = true`
4. RTK Query wywołuje `POST /api/auth/login`
5. Odpowiedź:
   - Sukces → zapisanie tokenów do Redux store → toast sukcesu → `window.location.assign(getRouteAddress)`
   - Błąd → toast błędu (globalnie obsługiwany w apiSlice)

**Komponenty UI użyte:**

- `@radix-ui/react-form` (Form.Root, Form.Submit)
- `FormInput` (custom component z walidacją)
- `SubmitButton` (custom component z loading state)

**ARIA i dostępność:**

- FormInput zarządza automatycznie aria attributes
- Focus management
- Error messages z odpowiednimi rolami

---

#### 2.2.2. SignUpPage i SignUpForm

**Lokalizacja:**
- `src/components/pages/SignUpPage.tsx` (page wrapper)
- `src/components/forms/SignUpForm.tsx` (formularz rejestracji)

**Odpowiedzialność SignUpPage:**

- Renderowanie tytułu "Definition quest"
- Renderowanie `SignUpForm`
- Link do "Zaloguj się"
- Stylowanie layoutu strony rejestracji

**Odpowiedzialność SignUpForm:**

- Zarządzanie stanem formularza przez `react-hook-form` z `zodResolver`
- Walidacja po stronie klienta przez `ClientSignUpSchema` (email, hasło min 6 znaków, displayName 1-40 znaków, repeatPassword)
- Dodatkowa walidacja: hasło i powtórzone hasło muszą być identyczne (refine w ClientSignUpSchema)
- Wywołanie mutacji RTK Query `useSignUpMutation()`
- Po sukcesie – toast sukcesu → przekierowanie na `/` (login)

**State (react-hook-form):**

```typescript
{
  email: string;
  password: string;
  displayName: string;
  repeatPassword: string;
}
// + formState.errors, isLoading z RTK Query
```

**Walidacja kliencka:**

- Email: Zod email validation
- Password: minimum 6 znaków
- DisplayName: 1-40 znaków
- RepeatPassword: musi być identyczne z password (refine)

**Flow:**

1. Użytkownik wprowadza dane (displayName, email, password, repeatPassword)
2. Walidacja onBlur przez Zod schema
3. Kliknięcie "Zarejestruj" → `isLoading = true`
4. RTK Query wywołuje `POST /api/auth/signUp`
5. Odpowiedź:
   - Sukces → toast sukcesu → `window.location.assign(Routes.Login)`
   - Błąd → toast błędu (globalnie obsługiwany)

**Komponenty UI użyte:**

- `@radix-ui/react-form`
- `FormInput` (4 inputy: displayName, email, password, repeatPassword)
- `SubmitButton`

---

#### 2.2.3. ForgotPasswordPage i ForgotPasswordForm

**Lokalizacja:**
- `src/components/pages/ForgotPasswordPage.tsx` (page wrapper)
- `src/components/forms/ForgotPasswordForm.tsx` (formularz)

**Odpowiedzialność ForgotPasswordPage:**

- Renderowanie tytułu "Definition quest"
- Renderowanie `ForgotPasswordForm`
- Link "Wróć do logowania"
- Stylowanie layoutu

**Odpowiedzialność ForgotPasswordForm:**

- Zarządzanie stanem formularza przez `react-hook-form` z `zodResolver`
- Walidacja emaila przez `ForgotPasswordSchema`
- Wywołanie mutacji RTK Query `useForgotPasswordMutation()`
- Wyświetlenie komunikatu sukcesu przez toast (globalnie)
- Security best practice: zawsze pokazujemy sukces, nie ujawniamy czy email istnieje

**State (react-hook-form):**

```typescript
{
  email: string;
}
// + isLoading z RTK Query, isSuccess
```

**Flow:**

1. Użytkownik wprowadza email
2. Kliknięcie "Wyślij link" → `isLoading = true`
3. RTK Query wywołuje `POST /api/auth/forgot-password`
4. Odpowiedź zawsze sukces → toast "Sprawdź skrzynkę - Wysłaliśmy link resetujący hasło"
5. Input i przycisk zostają disabled po sukcesie

**Komponenty UI użyte:**

- `@radix-ui/react-form`
- `FormInput`
- `SubmitButton` (disabled po sukcesie)

---

#### 2.2.4. ResetPasswordPage i ResetPasswordForm

**Lokalizacja:**
- `src/components/pages/ResetPasswordPage.tsx` (page wrapper z logiką tokenów)
- `src/components/forms/ResetPasswordForm.tsx` (formularz)

**Odpowiedzialność ResetPasswordPage:**

- Wydobycie tokenów z URL hash: `#access_token=...&refresh_token=...`
- Walidacja obecności tokenów
- Jeśli brak tokenów → komunikat błędu → przekierowanie na `/forgot-password` po 2 sekundach
- Jeśli tokeny są OK → renderowanie `ResetPasswordForm` z tokenami jako props
- Renderowanie tytułu i layoutu strony

**Odpowiedzialność ResetPasswordForm:**

- Zarządzanie stanem formularza przez `react-hook-form` z `zodResolver`
- Walidacja przez custom `ClientSchema`: newPassword min 6 znaków, confirmPassword musi być identyczne
- Wywołanie mutacji RTK Query `useResetPasswordMutation()` z tokenami i nowym hasłem
- Po sukcesie – toast sukcesu → automatyczne przekierowanie na `/` (w apiSlice)

**Props ResetPasswordForm:**

```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

**State (react-hook-form):**

```typescript
{
  newPassword: string;
  confirmPassword: string;
}
// + formState.errors, isLoading z RTK Query
```

**Walidacja kliencka:**

- newPassword: minimum 6 znaków
- confirmPassword: musi być identyczne z newPassword (refine)

**Flow:**

1. ResetPasswordPage wydobywa tokeny z URL hash
2. Użytkownik wprowadza nowe hasło (2x)
3. Kliknięcie "Zmień hasło" → `isLoading = true`
4. RTK Query wywołuje `POST /api/auth/reset-password` z payload: `{ accessToken, refreshToken, newPassword }`
5. Odpowiedź:
   - Sukces → toast "Hasło zostało zmienione" → `window.location.href = "/"`
   - Błąd → toast błędu

**Komponenty UI użyte:**

- `@radix-ui/react-form`
- `FormInput` (2x: newPassword, confirmPassword z showPasswordToggle)
- `SubmitButton`

---

#### 2.2.5. Sidebar (Nawigacja użytkownika)

**Lokalizacja:** `src/components/ui/sidebar/Sidebar.tsx`

**Odpowiedzialność:**

- Wyświetlenie nawigacji po aplikacji dla zalogowanych użytkowników
- Lista linków nawigacyjnych z ikonami
- Przycisk wylogowania na dole sidebar'a
- Mechanizm collapse/expand (desktop i mobile)
- Automatyczne zamykanie przy kliknięciu poza sidebar (mobile)

**Elementy nawigacji:**

```typescript
const navItems = [
  { label: "Publiczne tablice", route: Routes.Boards, icon: BoardsIcon },
  { label: "Moje tablice", route: Routes.MyBoards, icon: MyBoardsIcon },
  { label: "Rozegrane Tablice", route: Routes.MyPlayedBoards, icon: PlayedIcon },
  { label: "Utwórz tablicę", route: "/boards/create", icon: PlusIcon },
];
```

**Funkcjonalności:**

- `SidebarToggleButton` – przełączanie widoczności
- `NavItem` – pojedynczy element nawigacji z visual feedback dla aktywnej strony
- Przycisk "Wyloguj" → wywołanie `useLogoutMutation()` → automatyczne przekierowanie (w apiSlice)
- Hook `useSidebar()` – zarządzanie stanem collapsed/expanded
- Hook `useClickOutside()` – zamykanie sidebar przy kliknięciu poza nim

**Komponenty powiązane:**

- `src/components/ui/sidebar/SidebarToggleButton.tsx`
- `src/components/ui/sidebar/NavItem.tsx`
- `src/hooks/useSidebar.ts`
- `src/hooks/useClickOutside.ts`

**Uwaga:** W implementacji nie ma komponentu `UserNav` jak w planie. Zamiast tego jest `Sidebar` z nawigacją i wylogowaniem.

---

### 2.3. Layout i ochrona stron

#### 2.3.1. Layout.astro (jedyny layout)

**Lokalizacja:** `src/layouts/Layout.astro`

**Odpowiedzialność:**

- Podstawowy layout dla wszystkich stron
- Nie sprawdza sesji użytkownika
- Renderuje tylko `<slot />` dla zawartości strony
- Ustawia podstawowe meta tagi i style

**Struktura:**

```astro
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Uwaga:** W implementacji NIE MA `AuthenticatedLayout.astro` jak zakładał plan.

---

#### 2.3.2. ProtectedRoute (HOC dla React)

**Lokalizacja:** `src/components/HOC/ProtectedRoute.tsx`

**Odpowiedzialność:**

- Higher-Order Component zabezpieczający strony wymagające autentykacji
- Sprawdza stan autentykacji z Redux store (`accessToken`, `isAuthenticated`)
- Przekierowuje niezalogowanych użytkowników na `/?return=<current_path>`
- Przekierowuje zalogowanych użytkowników ze stron auth (login, signup) na `/boards`

**Logika:**

```typescript
const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
const pathname = window.location.pathname;

const isProtected = Object.values(ProtectedRoutes).includes(pathname as ProtectedRoutes);
const isAuthPage = authPages.includes(pathname as Routes);
const authed = Boolean(accessToken) && isAuthenticated;

useEffect(() => {
  // Redirect unauthenticated users trying to access protected routes
  if (isProtected && !authed) {
    window.location.replace(`/?return=${encodeURIComponent(pathname)}`);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && authed) {
    window.location.replace(Routes.Boards);
  }
}, [isProtected, authed, pathname]);
```

**Użycie:**

- Komponent jest używany w `Providers.tsx` do opakowywania zawartości aplikacji
- Działa po stronie klienta (React), nie po stronie serwera (Astro)

**Protected Routes:**

```typescript
export const ProtectedRoutes = {
  BOARDS: Routes.Boards,
  MY_BOARDS: Routes.MyBoards,
  MY_PLAYED_BOARDS: Routes.MyPlayedBoards,
} as const;
```

---

### 2.4. Zabezpieczenie stron wymagających autentykacji

**Implementacja:**

Zabezpieczenie stron odbywa się przez komponent React `ProtectedRoute`, nie przez Astro layout:

1. **Strony Astro** renderują komponenty React z `client:load`
2. **Komponenty React** są opakowane w `<Providers>` (zawiera Redux Provider)
3. **Wewnątrz Providers** jest `<ProtectedRoute>` który sprawdza autentykację z Redux store
4. **Jeśli użytkownik niezalogowany** i próbuje wejść na chronioną stronę → przekierowanie na `/?return=<current_path>`
5. **Jeśli użytkownik zalogowany** i próbuje wejść na stronę auth (login, signup) → przekierowanie na `/boards`

**Przykład dla `src/pages/boards.astro`:**

```astro
---
import React from "react";
import { BoardsPage } from "@/components/pages/BoardsPage";
import Layout from "@/layouts/Layout.astro";
---

<Layout>
  <BoardsPage client:load />
</Layout>
```

**BoardsPage Component:**

```tsx
import { withProviders } from "@/components/HOC/Providers";

const BoardsPageComponent: FC = () => {
  // ... logika komponentu
};

export const BoardsPage = withProviders(BoardsPageComponent);
```

**withProviders HOC:**

Opakowuje komponent w `<Providers>` który zawiera `<ProtectedRoute>`:

```tsx
export const withProviders = (Component: ComponentType) => {
  return (props: any) => (
    <Providers>
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    </Providers>
  );
};
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
{
  errors.email && (
    <p className="text-sm text-destructive" role="alert" aria-live="polite">
      {errors.email}
    </p>
  );
}
```

**Global errors (nad formularzem):**

```tsx
{
  error && (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
```

**Success messages:**

```tsx
{
  success && (
    <Alert variant="success">
      <AlertTitle>Success</AlertTitle>
      <AlertDescription>Account created successfully!</AlertDescription>
    </Alert>
  );
}
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
├── login.ts           # POST – logowanie użytkownika
├── signUp.ts          # POST – rejestracja użytkownika
├── logout.ts          # POST – wylogowanie użytkownika
├── forgot-password.ts # POST – żądanie resetu hasła
├── reset-password.ts  # POST – ustawienie nowego hasła
└── refresh-token.ts   # POST – odświeżenie access token (NOWY)
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
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Parsowanie body
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Walidacja
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: result.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = result.data;

  // 3. Wywołanie Supabase Auth
  const { data, error } = await locals.supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.status || 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Sukces
  return new Response(JSON.stringify({ data, message: "Logged in successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1).max(40, "Display name must be 1-40 characters"),
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
import type { APIRoute } from "astro";
import { z } from "zod";

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
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Walidacja
  const result = signUpSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: result.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password, displayName } = result.data;

  // 3. Wywołanie Supabase Auth
  const { data: authData, error: authError } = await locals.supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    // Email już istnieje
    if (authError.message.includes("already registered")) {
      return new Response(JSON.stringify({ error: "User with this email already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: authError.message }), {
      status: authError.status || 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = authData.user;
  if (!user) {
    return new Response(JSON.stringify({ error: "User creation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 4. Utworzenie rekordu w user_meta
  const { error: metaError } = await locals.supabase.from("user_meta").insert({
    id: user.id,
    display_name: displayName,
  });

  if (metaError) {
    // Błąd utworzenia profilu – opcjonalnie można usunąć użytkownika z auth
    // (w praktyce można pozwolić na to, że user_meta utworzy się później)
    console.error("Failed to create user_meta:", metaError);

    // Dla MVP: kontynuujemy, profil można utworzyć później
    // Dla produkcji: rozważyć rollback lub webhook
  }

  // 5. Sukces
  return new Response(
    JSON.stringify({
      data: { user },
      message: "Account created successfully. Please check your email for verification.",
    }),
    { status: 201, headers: { "Content-Type": "application/json" } }
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
import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  const { error } = await locals.supabase.auth.signOut();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Logged out successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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
  email: z.string().email("Invalid email format"),
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
import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = forgotPasswordSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: result.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email } = result.data;

  // Wywołanie Supabase Auth
  await locals.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  });

  // Zawsze zwracamy sukces (security best practice)
  return new Response(JSON.stringify({ message: "Password reset link sent. Please check your email." }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
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
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
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
import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = resetPasswordSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: "Validation failed", details: result.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { newPassword } = result.data;

  // Sprawdzenie sesji (token resetujący tworzy sesję)
  const {
    data: { user },
    error: userError,
  } = await locals.supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Aktualizacja hasła
  const { error: updateError } = await locals.supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: updateError.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "Password updated successfully" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
```

---

### 3.7. Middleware

**Lokalizacja:** `src/middleware/index.ts`

**Odpowiedzialność:**

1. Dodanie Supabase client do `context.locals`
2. Sprawdzanie autentykacji dla endpointów API (nie dla stron)
3. Dodanie zalogowanego użytkownika do `context.locals.user`
4. Wymuszenie autentykacji dla chronionych endpointów

**Publiczne endpointy:**

```typescript
const PUBLIC_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/signUp",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/refresh-token",
];
```

**Logika middleware:**

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Zawsze dodaj Supabase client do locals
  context.locals.supabase = supabaseClient;

  // Sprawdź czy to endpoint API
  const isApiEndpoint = context.url.pathname.startsWith("/api/");

  // Dla non-API requestów, kontynuuj
  if (!isApiEndpoint) {
    return next();
  }

  // Spróbuj pobrać zalogowanego użytkownika
  const { data: { user }, error: authError } = 
    await context.locals.supabase.auth.getUser();

  // Dodaj usera do locals jeśli jest zalogowany
  if (!authError && user) {
    context.locals.user = user;
  }

  // Dla chronionych endpointów, wymagaj autentykacji
  const isPublic = isPublicEndpoint(context.url.pathname);
  if (!isPublic && (!user || authError)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
});
```

**Uwaga:** Middleware chroni tylko endpointy API. Zabezpieczenie stron odbywa się przez komponent React `ProtectedRoute`.

---

### 3.7. Endpoint: POST /api/auth/refresh-token

**Lokalizacja:** `src/pages/api/auth/refresh-token.ts`

**Odpowiedzialność:**

- Odświeżenie access token używając refresh token
- Wywołanie `supabase.auth.refreshSession({ refresh_token })`
- Zwrócenie nowych tokenów (access i refresh)

**Request body schema (Zod):**

```typescript
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
```

**Flow:**

1. Parsowanie i walidacja JSON body
2. Wywołanie `supabase.auth.refreshSession({ refresh_token: refreshToken })`
3. Jeśli sukces:
   - Zwrócenie `{ data: { session: { accessToken, refreshToken } }, message: 'Token refreshed successfully' }`
   - Status: `200`
4. Jeśli błąd:
   - Zwrócenie `{ error: 'Invalid or expired refresh token' }`
   - Status: `401`

**Przykładowa implementacja (kontrakt):**

```typescript
import type { APIRoute } from "astro";
import { RefreshTokenSchema } from "../../../lib/validation/auth";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  // ... walidacja body przez RefreshTokenSchema
  
  const { data: sessionData, error: refreshError } = 
    await locals.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

  if (refreshError || !sessionData.session) {
    throw new HttpError("INVALID_REFRESH_TOKEN", 401);
  }

  return createSuccessResponse({
    data: {
      session: {
        accessToken: sessionData.session.access_token,
        refreshToken: sessionData.session.refresh_token,
      },
    },
    message: "Token refreshed successfully",
  }, 200);
};
```

**Uwaga:** Ten endpoint jest używany automatycznie przez RTK Query w `baseQueryWithReauth` gdy access token wygasa (status 401).

---

### 3.8. Obsługa błędów na poziomie backendu

#### 3.8.1. Struktura odpowiedzi błędu

Wszystkie endpointy zwracają błędy w formacie:

```json
{
  "error": "Główna wiadomość błędu",
  "details": {
    /* opcjonalne szczegóły, np. z Zod */
  }
}
```

#### 3.8.2. Kody statusu HTTP

| Kod | Znaczenie             | Użycie                                     |
| --- | --------------------- | ------------------------------------------ |
| 200 | OK                    | Sukces (GET, POST logout, forgot-password) |
| 201 | Created               | Sukces (POST signUp)                       |
| 400 | Bad Request           | Błąd walidacji, nieprawidłowy JSON         |
| 401 | Unauthorized          | Nieprawidłowe dane logowania, token wygasł |
| 409 | Conflict              | Email już istnieje (signUp)                |
| 500 | Internal Server Error | Błąd serwera, błąd Supabase                |

#### 3.8.3. Logowanie błędów

- Wszystkie błędy serwera (status >= 500) powinny być logowane do konsoli lub zewnętrznego systemu logowania
- Błędy użytkownika (400, 401, 409) mogą być logowane opcjonalnie dla celów audytu

**Przykład:**

```typescript
if (error.status >= 500) {
  console.error("[AUTH ERROR]", error.message, error);
}
```

---

### 3.9. Typy (DTO)

**Lokalizacja:** `src/types.ts`

**Zaimplementowane typy Auth:**

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
  accessToken: string;
  refreshToken: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
}

export interface AuthSessionDTO {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  data?: {
    user: AuthUserDTO;
    session?: AuthSessionDTO;
  };
  message?: string;
  error?: string;
}
```

**Uwaga:** `ResetPasswordRequest` zawiera tokeny jako parametry (nie są automatycznie w sesji Supabase), ponieważ są wydobywane z URL hash po stronie klienta.

---

## 4. System autentykacji

### 4.0. Redux Toolkit Query (RTK Query)

**Lokalizacja:** `src/store/api/apiSlice.ts`

**Odpowiedzialność:**

Aplikacja wykorzystuje **Redux Toolkit Query** do zarządzania komunikacją z API:

1. **Centralne zarządzanie stanem** – Redux store przechowuje:
   - Tokeny autentykacji (`accessToken`, `refreshToken`)
   - Status autentykacji (`isAuthenticated`)
   - Informacje o użytkowniku
   
2. **Automatyczne zarządzanie tokenami:**
   - Każde zapytanie API automatycznie dodaje header `Authorization: Bearer <accessToken>`
   - Przy 401 error, automatyczne odświeżenie tokenu przez `baseQueryWithReauth`
   - Po odświeżeniu tokenu, ponowienie oryginalnego zapytania

3. **Globalna obsługa błędów i toastów:**
   - Każda mutacja automatycznie wyświetla toast sukcesu/błędu
   - Centralna obsługa w `onQueryStarted` dla każdego endpoint'a

**Base Query z automatycznym reauth:**

```typescript
const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Nie próbuj odświeżać dla endpointów auth
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    
    if (!refreshToken) {
      // Wyloguj użytkownika
      await baseQuery({ url: "/api/auth/logout", method: "POST" }, api, extraOptions);
      handleClientLogout(api.dispatch);
      return result;
    }

    // Odśwież token
    const refreshResult = await baseQuery({
      url: "/api/auth/refresh-token",
      method: "POST",
      body: { refreshToken },
    }, api, extraOptions);

    if (refreshResult.data) {
      // Zapisz nowe tokeny
      api.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));
      // Ponów zapytanie
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};
```

**Mutacje Auth:**

- `useLoginMutation()` – logowanie + zapis tokenów do store + toast
- `useSignUpMutation()` – rejestracja + toast
- `useLogoutMutation()` – wylogowanie + czyszczenie store + przekierowanie
- `useForgotPasswordMutation()` – żądanie resetu + toast
- `useResetPasswordMutation()` – reset hasła + toast + przekierowanie na login

---

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

Aplikacja przechowuje tokeny w **Redux store** (client-side):

- `accessToken` – JWT token z krótkim czasem życia (domyślnie 1 godzina)
- `refreshToken` – token do odświeżania access token
- `isAuthenticated` – boolean flag
- Store jest persistowany w localStorage przez Redux persist

**Lokalizacja:** `src/store/slices/authSlice.ts`

```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUserDTO | null;
  isAuthenticated: boolean;
}
```

#### 4.2.2. Session lifecycle

1. **Login:** 
   - `POST /api/auth/login` → zwraca tokeny
   - RTK Query zapisuje tokeny do Redux store przez `setCredentials` action
   - Store jest automatycznie persistowany w localStorage

2. **Refresh:** 
   - Automatyczne odświeżanie przy 401 error przez `baseQueryWithReauth`
   - Wywołanie `POST /api/auth/refresh-token` z refresh token
   - Zapisanie nowych tokenów przez `updateTokens` action

3. **Logout:** 
   - `POST /api/auth/logout` → usunięcie sesji po stronie serwera (jeśli istnieje)
   - Wywołanie `handleClientLogout()` → czyszczenie Redux store
   - Przekierowanie na `/`

#### 4.2.3. Dostęp do sesji

**W komponencie React:**

```typescript
import { useAppSelector } from "@/store/hooks";

const { accessToken, user, isAuthenticated } = useAppSelector((state) => state.auth);
```

**W RTK Query (automatycznie):**

```typescript
prepareHeaders: (headers, { getState }) => {
  const token = (getState() as RootState).auth.accessToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}
```

**W middleware Astro (dla endpointów API):**

```typescript
const { data: { user }, error } = await locals.supabase.auth.getUser();
// Token jest automatycznie brany z header Authorization przez Supabase client
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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
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
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (!session) {
  const redirectUrl = encodeURIComponent(Astro.url.pathname);
  return Astro.redirect(`/login?redirect=${redirectUrl}`);
}

const user = session.user;
// Pobierz profil użytkownika z user_meta...
---

<!doctype html>
<html>
  <head></head>...
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
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect("/login");
}

// Reszta logiki...
---
```

---

### 4.5. Obsługa tokenów

#### 4.5.1. Access token i refresh token

Tokeny są zarządzane przez aplikację (nie automatycznie przez Supabase client):

- **Access token:** JWT z krótkim czasem życia (domyślnie 1 godzina)
  - Przechowywany w Redux store
  - Automatycznie dodawany do każdego zapytania API w header `Authorization: Bearer <token>`
  
- **Refresh token:** token do odświeżania access token (domyślnie 30 dni)
  - Przechowywany w Redux store
  - Używany do odświeżenia access token gdy wygasa

**Bezpieczeństwo:**

- Tokeny są przechowywane w localStorage (przez Redux persist)
- Nie są HTTP-only (dostępne z JavaScript)
- XSS protection musi być zapewnione przez inne środki (CSP, sanityzacja inputów)

#### 4.5.2. Automatyczne odświeżanie sesji

Implementacja w `baseQueryWithReauth`:

1. Każde zapytanie API sprawdza response status
2. Jeśli status = 401 (Unauthorized):
   - Pobierz refresh token z Redux store
   - Wywołaj `POST /api/auth/refresh-token`
   - Zapisz nowe tokeny do store
   - Ponów oryginalne zapytanie
3. Jeśli refresh nie powiedzie się:
   - Wyloguj użytkownika (wyczyść store)
   - Przekieruj na stronę logowania

**Zalety tego podejścia:**

- Transparentne dla użytkownika (nie widzi błędów 401)
- Centralne zarządzanie w jednym miejscu
- Automatyczne dla wszystkich endpointów RTK Query

#### 4.5.3. Persistencja store

Redux store jest automatycznie zapisywany w localStorage przez Redux Persist:

- Zapis przy każdej zmianie state
- Automatyczne odtworzenie po odświeżeniu strony
- Użytkownik pozostaje zalogowany po zamknięciu i ponownym otwarciu przeglądarki

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
import Layout from "../layouts/Layout.astro";
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
if (error && error.message.includes("Email not confirmed")) {
  return new Response(
    JSON.stringify({
      error: "Please verify your email before logging in. Check your inbox for the confirmation link.",
    }),
    { status: 403, headers: { "Content-Type": "application/json" } }
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

### 6.6. POST /api/auth/refresh-token

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**

```json
{
  "data": {
    "session": {
      "accessToken": "new_jwt_token",
      "refreshToken": "new_refresh_token"
    }
  },
  "message": "Token refreshed successfully"
}
```

**Response (401 Unauthorized):**

```json
{
  "error": "Invalid or expired refresh token"
}
```

**Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": {
    "fieldErrors": {
      "refreshToken": ["Refresh token is required"]
    }
  }
}
```

**Uwaga:** Ten endpoint jest używany automatycznie przez RTK Query, nie jest wywoływany bezpośrednio przez użytkownika.

---

## 7. Podsumowanie i rekomendacje

### 7.1. Podsumowanie architektury

Moduł autentykacji dla **Definition Quest** wykorzystuje:

1. **Frontend (Astro + React + Redux):**
   - **4 strony Astro:** `/` (login), `/signup`, `/forgot-password`, `/reset-password`
   - **Page Components:** LoginPage, SignUpPage, ForgotPasswordPage, ResetPasswordPage
   - **Form Components:** AuthForm, SignUpForm, ForgotPasswordForm, ResetPasswordForm
   - **Sidebar:** Komponent nawigacji z wylogowaniem (zamiast UserNav)
   - **1 Layout:** Layout.astro (podstawowy dla wszystkich stron)
   - **ProtectedRoute HOC:** Zabezpieczenie stron wymagających autentykacji (client-side)
   - **Redux Toolkit Query:** Zarządzanie stanem, komunikacja z API, automatyczne odświeżanie tokenów
   - **Komponenty UI:** Radix UI (Form), custom FormInput, SubmitButton

2. **Backend (Astro API routes + Supabase):**
   - **6 endpointów API:** login, signUp, logout, forgot-password, reset-password, refresh-token
   - **Walidacja Zod** dla wszystkich request bodies
   - **Middleware** chroniący endpointy API przed dostępem niezalogowanych użytkowników
   - **Supabase Auth** jako backend autentykacyjny
   - **Strukturalne response helpers** (createSuccessResponse, createErrorResponse)
   - **Custom error classes** (HttpError, ValidationError)

3. **Baza danych (PostgreSQL via Supabase):**
   - Tabela `auth.users` (zarządzana przez Supabase Auth)
   - Tabela `user_meta` (display_name, avatar_url)
   - RLS policies dla user_meta

4. **Zarządzanie stanem i sesjami:**
   - **Redux store** przechowuje accessToken, refreshToken, user, isAuthenticated
   - **Redux Persist** zapisuje store w localStorage
   - **Automatyczne odświeżanie tokenów** przy 401 error w baseQueryWithReauth
   - **Globalna obsługa toastów** dla sukcesu/błędu operacji

5. **Zabezpieczenia:**
   - Tokeny w localStorage (nie HTTP-only cookies)
   - Zod validation na wszystkich endpointach
   - Authorization header z Bearer token dla chronionych endpointów
   - Middleware sprawdza autentykację dla API
   - ProtectedRoute sprawdza autentykację dla stron (client-side)
   - Feature flags dla włączania/wyłączania funkcjonalności

---

### 7.2. Kluczowe decyzje architektoniczne

1. **Astro dla stron + React dla interaktywności:**
   - Astro renderuje strony z `client:load` dla React components
   - React zarządza interaktywnością, formularzami, stanem
   - Lepsze SEO i performance dzięki Astro

2. **Redux Toolkit Query zamiast prostych fetch:**
   - Centralne zarządzanie stanem autentykacji
   - Automatyczne odświeżanie tokenów przy 401 error
   - Globalna obsługa toastów i błędów
   - Cache management dla danych z API
   - Type-safe mutations i queries

3. **Client-side protection (ProtectedRoute) zamiast server-side (AuthenticatedLayout):**
   - Zabezpieczenie stron przez React HOC sprawdzający Redux store
   - Nie ma AuthenticatedLayout.astro - jest tylko podstawowy Layout.astro
   - Szybkie przekierowania bez dodatkowych zapytań do serwera
   - Middleware chroni tylko endpointy API

4. **Tokeny w localStorage zamiast HTTP-only cookies:**
   - Redux Persist automatycznie zapisuje store
   - Łatwiejsze zarządzanie tokenami po stronie klienta
   - Wymaga dodatkowej uwagi na bezpieczeństwo XSS
   - Bearer token w Authorization header dla API calls

5. **Sidebar zamiast UserNav:**
   - Pełna nawigacja po aplikacji w jednym miejscu
   - Wylogowanie jako element sidebar (nie dropdown)
   - Collapse/expand functionality dla desktop i mobile

6. **Supabase Auth jako backend:**
   - Kompleksowe rozwiązanie (auth, email, session management)
   - Minimalizuje potrzebę custom implementacji
   - Row Level Security dla zabezpieczenia danych

7. **Zod dla walidacji + react-hook-form:**
   - Type-safe validation przez zodResolver
   - Spójność między klientem a serwerem (te same schematy)
   - Automatyczne generowanie błędów walidacji
   - Łatwa integracja z Radix UI Form

8. **Strukturalne response helpers:**
   - `createSuccessResponse()`, `createErrorResponse()`
   - Spójne formaty odpowiedzi z wszystkich endpointów
   - Error mapping dla przyjaznych komunikatów użytkownika

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

### 7.5. Checklist implementacyjny (Stan faktyczny)

#### Backend ✅

- [x] Endpoint `POST /api/auth/login`
- [x] Endpoint `POST /api/auth/signUp` z utworzeniem user_meta
- [x] Endpoint `POST /api/auth/logout`
- [x] Endpoint `POST /api/auth/forgot-password`
- [x] Endpoint `POST /api/auth/reset-password` (z tokenami jako parametry)
- [x] Endpoint `POST /api/auth/refresh-token` (DODATKOWY)
- [x] Aktualizacja middleware (PUBLIC_ENDPOINTS + refresh-token)
- [x] Dodanie typów Auth do `src/types.ts` (+ RefreshTokenRequest)
- [x] Validation schemas w `src/lib/validation/auth.ts`
- [x] Response helpers (createSuccessResponse, createErrorResponse)
- [x] Custom error classes (HttpError, ValidationError)
- [x] Feature flags dla auth endpoints

#### Frontend - Redux & Store ✅

- [x] Redux store setup z Redux Toolkit
- [x] Auth slice (`src/store/slices/authSlice.ts`)
- [x] RTK Query API slice (`src/store/api/apiSlice.ts`)
- [x] Base query z automatycznym reauth (`baseQueryWithReauth`)
- [x] Toast slice dla globalnych komunikatów
- [x] Redux Persist dla localStorage

#### Frontend - Komponenty UI ✅

- [x] `FormInput` (custom component z walidacją)
- [x] `SubmitButton` (custom component z loading state)
- [x] Radix UI Form (`@radix-ui/react-form`)
- [x] `Sidebar` zamiast UserNav (z nawigacją i wylogowaniem)
- [x] `SidebarToggleButton`
- [x] `NavItem`

#### Frontend - Page Components ✅

- [x] `LoginPage.tsx` (wrapper dla AuthForm)
- [x] `SignUpPage.tsx` (wrapper dla SignUpForm)
- [x] `ForgotPasswordPage.tsx` (wrapper dla ForgotPasswordForm)
- [x] `ResetPasswordPage.tsx` (wrapper z logiką tokenów z URL hash)

#### Frontend - Form Components ✅

- [x] `AuthForm.tsx` (formularz logowania)
- [x] `SignUpForm.tsx` (z repeatPassword)
- [x] `ForgotPasswordForm.tsx`
- [x] `ResetPasswordForm.tsx` (przyjmuje tokeny jako props)

#### Frontend - Strony Astro ✅

- [x] `index.astro` (strona logowania, nie `login.astro`)
- [x] `signup.astro`
- [x] `forgot-password.astro`
- [x] `reset-password.astro`
- [ ] `email-confirmed.astro` (NIE ZAIMPLEMENTOWANE)

#### Layouts i Zabezpieczenia ✅

- [x] `Layout.astro` (podstawowy, bez sprawdzania sesji)
- [x] `ProtectedRoute.tsx` HOC (zamiast AuthenticatedLayout.astro)
- [x] `Providers.tsx` HOC z Redux Provider i ProtectedRoute
- [x] `withProviders()` helper do opakowywania page components
- [x] Protected routes: `/boards`, `/my-boards`, `/played`
- [x] Automatic redirect dla zalogowanych na stronach auth
- [x] Konfiguracja Supabase Auth (redirect URLs dla reset password)

#### Hooks ✅

- [x] `useSidebar` (zarządzanie stanem sidebar)
- [x] `useClickOutside` (zamykanie sidebar)
- [x] `useQueryParams` (obsługa ?return=...)
- [x] Redux hooks (`useAppSelector`, `useAppDispatch`)

#### Validation Schemas ✅

- [x] `LoginSchema` w `src/lib/validation/auth.ts`
- [x] `SignUpSchema` w `src/lib/validation/auth.ts`
- [x] `ForgotPasswordSchema` w `src/lib/validation/auth.ts`
- [x] `ResetPasswordSchema` w `src/lib/validation/auth.ts`
- [x] `RefreshTokenSchema` w `src/lib/validation/auth.ts`
- [x] `ClientSignUpSchema` w `src/lib/schemas/auth.ts` (z repeatPassword)

#### Dokumentacja i testy

- [x] Testy jednostkowe komponentów UI (`tests/unit/components/`)
- [ ] Testy integracyjne endpointów API (częściowo)
- [ ] Testy E2E (częściowo w `tests/e2e/auth/`)
- [ ] Aktualizacja README.md (do zrobienia)
- [ ] Aktualizacja CHANGELOG.md (do zrobienia)
- [x] Aktualizacja tej specyfikacji (TERAZ)

---

## 8. Różnice między planem a implementacją

### 8.1. Główne różnice

#### 8.1.1. Routing

- **Plan:** Strona logowania na `/login.astro`
- **Rzeczywistość:** Strona logowania na `/` (`index.astro`)
- **Routing:** `Routes.Login = "/"`

#### 8.1.2. Komponenty

- **Plan:** Osobne komponenty `LoginForm.tsx`, `SignUpForm.tsx`, etc.
- **Rzeczywistość:** 
  - Warstwa page components: `LoginPage.tsx`, `SignUpPage.tsx`, etc.
  - Warstwa form components: `AuthForm.tsx` (nie LoginForm), `SignUpForm.tsx`, etc.
  - Każdy page component renderuje odpowiedni form i dostarcza layout

#### 8.1.3. Layout i zabezpieczenia

- **Plan:** `AuthenticatedLayout.astro` sprawdzający sesję po stronie serwera
- **Rzeczywistość:** 
  - Tylko jeden `Layout.astro` (nie sprawdza sesji)
  - `ProtectedRoute.tsx` HOC sprawdzający autentykację po stronie klienta (Redux store)
  - Zabezpieczenie przez React, nie przez Astro SSR

#### 8.1.4. Nawigacja użytkownika

- **Plan:** `UserNav.tsx` z dropdown menu (profile, settings, logout)
- **Rzeczywistość:** `Sidebar.tsx` z pełną nawigacją i przyciskiem wylogowania na dole

#### 8.1.5. Zarządzanie stanem

- **Plan:** Proste fetch calls, sesja w cookies
- **Rzeczywistość:**
  - Redux Toolkit Query dla wszystkich API calls
  - Tokeny w Redux store (localStorage przez Redux Persist)
  - Automatyczne odświeżanie tokenów przy 401 error
  - Globalna obsługa toastów

#### 8.1.6. Reset password

- **Plan:** Token w query params: `?token=...&type=recovery`
- **Rzeczywistość:** 
  - Tokeny w URL hash: `#access_token=...&refresh_token=...`
  - ResetPasswordPage wydobywa tokeny z hash i przekazuje do ResetPasswordForm jako props
  - Endpoint przyjmuje tokeny jako parametry w body (nie automatycznie z sesji)

#### 8.1.7. Dodatkowe funkcjonalności

**Rzeczywistość zawiera więcej niż plan:**

1. **Endpoint `/api/auth/refresh-token`** – nie było w planie
2. **Automatyczne odświeżanie tokenów** – w baseQueryWithReauth
3. **Feature flags** – dla włączania/wyłączania funkcjonalności auth
4. **Response helpers** – createSuccessResponse, createErrorResponse
5. **Custom error classes** – HttpError, ValidationError
6. **Error mapping** – przyjazne komunikaty dla użytkownika
7. **Toast notifications** – globalna obsługa przez Redux
8. **ClientSignUpSchema** – rozszerzony schema z repeatPassword dla walidacji client-side
9. **Hooks:** useSidebar, useClickOutside, useQueryParams

### 8.2. Dlaczego te różnice?

1. **Client-side protection zamiast server-side:**
   - Szybsze przekierowania (bez round-trip do serwera)
   - Lepsze UX (instant feedback)
   - Centralne zarządzanie stanem w Redux
   - Astro middleware chroni tylko API, nie strony

2. **Redux zamiast prostych fetch:**
   - Profesjonalniejsze zarządzanie stanem
   - Cache management dla lepszej performance
   - Automatyczne odświeżanie tokenów
   - Globalna obsługa błędów i toastów
   - Type-safe mutations i queries

3. **Page + Form components:**
   - Lepsze separation of concerns
   - Page component zarządza layoutem i kontekstem
   - Form component skupia się tylko na formularzu
   - Łatwiejsze testowanie i reużywalność

4. **Sidebar zamiast UserNav:**
   - Bardziej kompletna nawigacja w jednym miejscu
   - Lepsze UX dla aplikacji z wieloma sekcjami
   - Collapse/expand dla mobile i desktop

5. **Tokeny w localStorage:**
   - Łatwiejsze zarządzanie po stronie klienta
   - Redux Persist automatycznie zapisuje
   - Nie wymaga konfiguracji cookies
   - Wymaga uwagi na bezpieczeństwo XSS

### 8.3. Co pozostało zgodnie z planem

✅ Struktura endpointów API (+ refresh-token)  
✅ Walidacja Zod po stronie serwera  
✅ Middleware chroniący endpointy API  
✅ Supabase Auth jako backend  
✅ Tabela user_meta z display_name  
✅ 4 strony auth (login, signup, forgot-password, reset-password)  
✅ React forms z walidacją client-side  
✅ Wylogowanie przez API call  
✅ Security best practices (nie ujawniamy czy email istnieje w forgot-password)  
✅ Strukturalne typy DTO w src/types.ts  

---

## Koniec specyfikacji

**Data utworzenia:** 2025-10-23  
**Ostatnia aktualizacja:** 2025-12-01  
**Wersja:** 2.0 (zaktualizowana po implementacji)  
**Autor:** AI Assistant (Claude Sonnet 4.5)  
**Projekt:** Definition Quest  
**Stack:** Astro 5, React 19, TypeScript 5, Supabase, Tailwind 4, Redux Toolkit

---
