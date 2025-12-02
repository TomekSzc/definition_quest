# Plan implementacji widoku Sign In

## 1. Przegląd

Widok **Sign In** umożliwia użytkownikowi uwierzytelnienie się w aplikacji Definition Quest przy pomocy adresu e-mail i hasła lub jednego z dostawców OAuth (np. Google). Po pomyślnym zalogowaniu użytkownik zyskuje dostęp do funkcji wymagających autoryzacji, takich jak tworzenie i zapisywanie plansz z definicjami.

## 2. Routing widoku

- Ścieżka: `/` (root – strona logowania)
- Typ pliku: `src/pages/index.astro` (SSR, `prerender = false`) z dynamicznym komponentem `<LoginPage client:load />`
- Guard: logika przekierowania użytkownika zalogowanego obsługiwana jest w `ProtectedRoute`/middleware (poza zakresem tego widoku)

## 3. Struktura komponentów

```
LoginPage (React) ładowany w `index.astro`
└─ <AuthForm /> (React)
   ├─ <EmailInput />
   ├─ <PasswordInput />
   └─ <SubmitButton />
└─ <ToastContainer /> (global, osadzony w Layout)
```

## 4. Szczegóły komponentów

### AuthForm

- **Opis**: Formularz logowania obsługujący uwierzytelnienie przy pomocy e-mail/hasło. Przyciski OAuth zostały pominięte w bieżącej implementacji.
- **Główne elementy**:
  - `form` (native) z `onSubmit`
  - `EmailInput` – komponent `Input` z shadcn/ui (`type="email"`)
  - `PasswordInput` – komponent `InputPassword`
  - `SubmitButton` – `Button` z ikoną spinnera w stanie `isLoading`
  - (brak) Przyciski OAuth niezaimplementowane
- **Obsługiwane interakcje**:
  - `submit` → wywołuje hook `useLoginMutation`
- **Walidacja**:
  - `email` wymagany (walidacja `LoginSchema`)
  - `password` wymagane, min 8 znaków (`LoginSchema`)
  - Klient używa `react-hook-form` + `zodResolver(LoginSchema)`
- **Typy**:
  - `LoginRequest` (z `src/types.ts`)
  - `AuthResponse` (z `src/types.ts`)
  - `AuthFormData` (ViewModel – patrz §5)
- **Propsy**: brak (komponent root)

### (Pominięto) OAuthButtons

Pierwotnie planowano przyciski OAuth. Nie zostały zaimplementowane w pierwszej iteracji; sekcja pozostaje do ewentualnego rozszerzenia w przyszłości.

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
2. **Success**: `setCredentials(data)` (realizowane w `apiSlice.onQueryStarted`) + `window.location.assign(returnUrl ?? '/boards')`.
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
- Duplikacja żądania: przy aktywnym `isLoading` formularz zablokowany.
- Po pomyślnym logowaniu komponent sprawdza `res.data.user` i wykonuje redirect (z obsługą parametru `?return=`).

## 10. Obsługa błędów

| Kod            | Zachowanie                                                      |
| -------------- | --------------------------------------------------------------- |
| 400            | Pokazuje szczegóły walidacji z pola `details` w toście          |
| 401            | Toast „Nieprawidłowy email lub hasło”                           |
| 403            | Toast „Potwierdź adres e-mail przed logowaniem”                 |
| 500            | Toast „Wewnętrzny błąd serwera” + log `console.error`           |
| Brak internetu | RTKQ `error.status === "FETCH_ERROR"` → toast „Brak połączenia” |

## 11. Kroki implementacji

1. **Utworzono stronę** `src/pages/index.astro`, która importuje `<LoginPage client:load />` (z `Providers` wewnątrz komponentu).
2. Routing obsługuje Astro bez dodatkowej konfiguracji – root path `/`.
3. **Stworzono komponent** `src/components/forms/AuthForm.tsx` wg §4 (bez OAuth).
4. **Rozszerz `apiSlice`** o endpoint `login` zwracający typy DTO (jeśli nie istnieje) i wygeneruj hook `useLoginMutation`.
5. **W komponencie** zaimplementuj `react-hook-form` + `zodResolver(LoginSchema)`.
6. **Obsłuż sukces**: dispatch `setCredentials`, persist via redux-persist, `navigate` do `/dashboard`.
7. **Obsługa błędów** realizowana w `apiSlice.onQueryStarted` (toast z komunikatem błędu).
8. (pominięte) Przyciski OAuth planowane w późniejszej iteracji.
9. **Testy manualne**: walidacja formularza, obsługa błędów, redirect.
10. **Testy e2e** (Playwright): scenariusz poprawnego i błędnego logowania.
11. **Aktualizacja dokumentacji** README oraz changelog.
