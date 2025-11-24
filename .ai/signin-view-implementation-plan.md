# Plan implementacji widoku Sign In

## 1. Przegląd

Widok **Sign In** umożliwia użytkownikowi uwierzytelnienie się w aplikacji Definition Quest przy pomocy adresu e-mail i hasła lub jednego z dostawców OAuth (np. Google). Po pomyślnym zalogowaniu użytkownik zyskuje dostęp do funkcji wymagających autoryzacji, takich jak tworzenie i zapisywanie plansz z definicjami.

## 2. Routing widoku

- Ścieżka: `/signin`
- Typ pliku: `src/pages/signin.astro` (SSR, prerender = false)
- Guard: jeśli `isAuthenticated === true` następuje `redirect('/dashboard')`

## 3. Struktura komponentów

```
SignInPage (Astro)
└─ <AuthForm /> (React)
   ├─ <EmailInput />
   ├─ <PasswordInput />
   ├─ <SubmitButton />
   ├─ <Divider label="lub" />
   └─ <OAuthButtons />
└─ <ToastContainer /> (global, osadzony w Layout)
```

## 4. Szczegóły komponentów

### AuthForm

- **Opis**: Formularz logowania obsługujący tryb e-mail/hasło oraz prezentujący przyciski OAuth.
- **Główne elementy**:
  - `form` (native) z `onSubmit`
  - `EmailInput` – komponent `Input` z shadcn/ui (`type="email"`)
  - `PasswordInput` – komponent `InputPassword`
  - `SubmitButton` – `Button` z ikoną spinnera w stanie `isLoading`
  - `OAuthButtons` – lista przycisków dostawców
- **Obsługiwane interakcje**:
  - `submit` → wywołuje hook `useLoginMutation`
  - `click` na przyciskach OAuth → `supabase.auth.signInWithOAuth({ provider })`
- **Walidacja**:
  - `email` wymagany, regex RFC 5322
  - `password` wymagane, min 8 znaków
  - Klient używa `react-hook-form` + `zodResolver(LoginSchema)`
- **Typy**:
  - `LoginRequest` (z `src/types.ts`)
  - `AuthResponse` (z `src/types.ts`)
  - `AuthFormData` (ViewModel – patrz §5)
- **Propsy**: brak (komponent root)

### OAuthButtons

- **Opis**: Renderuje przyciski ikon dostawców (Google, GitHub). Oddzielony w celu ponownego wykorzystania.
- **Elementy**: `Button` z logo, `data-provider` atrybut.
- **Interakcje**: `onClick` → `handleOAuth(provider)`
- **Walidacja**: brak pól; obsługa błędów Supabase.
- **Propsy**: opcjonalnie `disabled` (gdy formularz w trakcie logowania e-mail/hasło).

## 5. Typy

```typescript
// Dodatkowy ViewModel dla AuthForm
export interface AuthFormData {
  email: string;
  password: string;
}
```

`LoginRequest` i `AuthResponse` są importowane z istniejącego kontraktu backendowego.

## 6. Zarządzanie stanem

- **Redux slice**: `authSlice` (już istnieje) – akcje `setCredentials`, `logout`.
- **RTK Query**: `useLoginMutation` z `apiSlice`.
- **Lokalny stan komponentu**: zarządzany przez `react-hook-form` (błędy walidacji, wartości pól).
- **Toast**: akcje `toastSlice.showToast` dla błędów/komunikatów.

## 7. Integracja API

| Akcja     | Endpoint               | Hook RTKQ          | Request DTO    | Response       |
| --------- | ---------------------- | ------------------ | -------------- | -------------- |
| Logowanie | `POST /api/auth/login` | `useLoginMutation` | `LoginRequest` | `AuthResponse` |

Flow:

1. `onSubmit` → `login({ email, password })`.
2. **Success**: `setCredentials(data)` + `navigate('/dashboard')`.
3. **Error**: mapowanie kodu → toast.

## 8. Interakcje użytkownika

| Interakcja            | Wynik UI                                         |
| --------------------- | ------------------------------------------------ |
| Wpisanie e-mail/hasło | Aktualizacja wartości formularza                 |
| Klik „Zaloguj”        | Spinner, przycisk disabled, wywołanie API        |
| Sukces                | Redirect + komunikat „Zalogowano”                |
| Błąd walidacji        | Inline error pod polem                           |
| Błąd 401/403/500      | Toast typu _error_ z opisem                      |
| Klik OAuth Google     | Otwarcie popup / redirect dopasowany do Supabase |

## 9. Warunki i walidacja

- Email i hasło wymagane – blokada przycisku do czasu spełnienia.
- Duplikacja żądania: przy aktywnym `isLoading` formularz i przyciski zablokowane.
- Po pomyślnym logowaniu komponent sprawdza, czy odpowiedź zawiera `user` i `session`, w przeciwnym razie zwróci toast _error_.

## 10. Obsługa błędów

| Kod            | Zachowanie                                                      |
| -------------- | --------------------------------------------------------------- |
| 400            | Pokazuje szczegóły walidacji z pola `details` w toście          |
| 401            | Toast „Nieprawidłowy email lub hasło”                           |
| 403            | Toast „Potwierdź adres e-mail przed logowaniem”                 |
| 500            | Toast „Wewnętrzny błąd serwera” + log `console.error`           |
| Brak internetu | RTKQ `error.status === "FETCH_ERROR"` → toast „Brak połączenia” |

## 11. Kroki implementacji

1. **Utwórz stronę** `src/pages/signin.astro`, wczytaj globalny `Providers` + auth guard.
2. **Dodaj trasę** do `astro.config.mjs` jeżeli używany jest custom router.
3. **Stwórz komponent** `src/components/AuthForm.tsx` wg §4.
4. **Rozszerz `apiSlice`** o endpoint `login` zwracający typy DTO (jeśli nie istnieje) i wygeneruj hook `useLoginMutation`.
5. **W komponencie** zaimplementuj `react-hook-form` + `zodResolver(LoginSchema)`.
6. **Obsłuż sukces**: dispatch `setCredentials`, persist via redux-persist, `navigate` do `/dashboard`.
7. **Obsłuż błędy**: mapuj kody na treści toastów.
8. **Dodaj przyciski OAuth** wykorzystujące `supabase.auth.signInWithOAuth`.
9. **Testy manualne**: walidacja formularza, obsługa błędów, redirect.
10. **Testy e2e** (Playwright): scenariusz poprawnego i błędnego logowania.
11. **Aktualizacja dokumentacji** README oraz changelog.
