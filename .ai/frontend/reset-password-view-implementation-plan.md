# Plan implementacji widoku Reset Password

## 1. Przegląd

Widok „Reset Password" umożliwia użytkownikowi ustawienie nowego hasła po kliknięciu linku otrzymanego e-mailem. Link otwiera stronę pod ścieżką `/reset-password` z tokenami przekazanymi w **hash fragment URL** (`#access_token=...&refresh_token=...`). Tokeny są ekstrahowane i walidowane **client-side** w komponencie `ResetPasswordPage.tsx`. Jeśli tokeny nie są obecne, użytkownik zobaczy komunikat błędu i zostanie przekierowany do widoku „Forgot Password" po 2 sekundach. Po pozytywnym ustawieniu hasła użytkownik otrzymuje informację o sukcesie w postaci toastu i zostaje przekierowany na stronę główną.

## 2. Routing widoku

- **Plik strony**: `src/pages/reset-password.astro`
- **Ścieżka URL**: `/reset-password`
- **URL params**: Hash fragment `#access_token=<jwt>&refresh_token=<jwt>` (nie query params!)
- **Client-side validation**: `ResetPasswordPage.tsx` ekstrahuje tokeny z `window.location.hash` w `useEffect`; w przypadku braku tokenów pokazuje błąd i przekierowuje do `/forgot-password` po 2s.

## 3. Struktura komponentów

```
reset-password.astro (Astro - prosty wrapper z Layout)
└── ResetPasswordPage.tsx (React - ekstrahuje i waliduje tokeny, zarządza stanem ładowania/błędu)
    └── ResetPasswordForm.tsx (React - formularz zmiany hasła)
        ├── FormInput (2× – newPassword, confirmPassword z showPasswordToggle)
        ├── SubmitButton
        └── ToastContainer (portal – globalny, przez withProviders HOC)
```

## 4. Szczegóły komponentów

### reset-password.astro

- **Opis**: Prosta strona Astro służąca jako wrapper dla głównego komponentu React.
- **Główne elementy**: `<Layout>` + `<ResetPasswordPage client:load />`.
- **Obsługiwane interakcje**: Brak, cała logika w komponentach React.
- **Walidacja**: Brak (przeniesiona do client-side).
- **Konfiguracja**: `export const prerender = false` dla obsługi dynamicznych route'ów.

### ResetPasswordPage.tsx

- **Opis**: Komponent React odpowiedzialny za ekstrahowanie tokenów z URL hash, ich walidację i zarządzanie stanem strony.
- **Główne elementy**: 
  - Stan ładowania z komunikatem "Ładowanie..."
  - Stan błędu z komunikatem "Link jest nieprawidłowy. Przekierowywanie..."
  - Renderowanie `<ResetPasswordForm />` po pomyślnej walidacji tokenów
  - Nagłówek H1 "Definition quest"
- **Obsługiwane interakcje**: 
  - `useEffect` ekstrahuje `access_token` i `refresh_token` z `window.location.hash`
  - Jeśli brak tokenów: `setError(true)` i `setTimeout(() => window.location.replace('/forgot-password'), 2000)`
  - Jeśli tokeny obecne: `setTokens({ accessToken, refreshToken })`
- **Walidacja**: Client-side sprawdzenie obecności obu tokenów w URL hash.
- **Typy**: 
  ```typescript
  tokens: { accessToken: string; refreshToken: string } | null
  error: boolean
  ```
- **Propsy**: Brak (komponent root, owinięty przez `withProviders` HOC).
- **HOC**: Używa `withProviders()` dla dostępu do Redux store i toast notifications.

### ResetPasswordForm.tsx

- **Opis**: Formularz React odpowiedzialny za przyjmowanie nowego hasła i przesyłanie go do API wraz z tokenami.
- **Główne elementy**:
  - Dwa pola `<FormInput type="password" />` z `showPasswordToggle`:
    - `newPassword` (label: "Nowe hasło")
    - `confirmPassword` (label: "Potwierdź hasło")
  - `<SubmitButton idleText="Zmień hasło" loadingText="Zapisywanie..." />`
- **Obsługiwane interakcje**:
  - Zarządzane przez `react-hook-form` z `zodResolver(ClientSchema)`
  - `onSubmit` wywołuje mutację RTK Query `useResetPasswordMutation()`
  - Przekazuje `{ accessToken, refreshToken, newPassword }` do API
- **Walidacja (client-side)**:
  1. `newPassword` ≥ 6 znaków (Zod schema)
  2. `confirmPassword` musi być identyczne z `newPassword` (Zod `.refine()`)
  3. Walidacja uruchamiana `mode: "onBlur"`
  4. Błędy wyświetlane inline pod polami
- **Typy**:
  - `ResetPasswordFormData` – ViewModel formularza (inferred z `ClientSchema`)
    ```typescript
    { newPassword: string; confirmPassword: string; }
    ```
  - `ResetPasswordRequest` – DTO do API (z `src/types.ts`)
    ```typescript
    { accessToken: string; refreshToken: string; newPassword: string; }
    ```
- **Propsy**: 
  ```typescript
  { accessToken: string; refreshToken: string; }
  ```

### ToastContainer (globalny)

- Już istnieje w `src/components/ui/Toast.tsx`, wykorzystywany przez `toastSlice`.
- Dostępny przez `withProviders` HOC, który opakowuje `ResetPasswordPage`.

## 5. Typy

### Client-side (formularz)

```ts
// src/components/forms/ResetPasswordForm.tsx
// Schemat walidacji Zod
const ClientSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof ClientSchema>;
// { newPassword: string; confirmPassword: string; }
```

### API (DTO)

```ts
// src/types.ts
export interface ResetPasswordRequest {
  accessToken: string;
  refreshToken: string;
  newPassword: string;
}
```

### Validation Schema (backend)

```ts
// src/lib/validation/auth.ts
export const ResetPasswordSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1, "Refresh token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
```

## 6. Zarządzanie stanem

### Lokalny state

- **ResetPasswordPage**: 
  - `tokens: { accessToken: string; refreshToken: string } | null` – przechowuje tokeny z URL
  - `error: boolean` – flaga błędu dla missing tokenów
- **ResetPasswordForm**: 
  - Zarządzany przez `react-hook-form` z konfiguracją:
    - `resolver: zodResolver(ClientSchema)`
    - `mode: "onBlur"` – walidacja przy opuszczeniu pola

### Globalny state

- **Toast notifications** przez `toastSlice` (Redux).
- **Mutacja API** w `src/store/api/apiSlice.ts`:
  ```typescript
  resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>({
    query: (body) => ({
      url: "/api/auth/reset-password",
      method: "POST",
      body,
    }),
    async onQueryStarted(_, { dispatch, queryFulfilled }) {
      try {
        const { data } = await queryFulfilled;
        dispatch(
          showToast({
            type: "success",
            title: "Sukces",
            message: data.message || "Hasło zostało zmienione.",
          })
        );
        // Przekierowanie na stronę główną
        window.location.href = "/";
      } catch (err: unknown) {
        const errorMessage =
          (err as { error?: { data?: { error?: string } } }).error?.data?.error 
          ?? "Nie udało się zresetować hasła";
        dispatch(showToast({ type: "error", title: "Błąd", message: errorMessage }));
      }
    },
  })
  ```
- **Hook**: `useResetPasswordMutation()` – eksportowany z `apiSlice.ts`.

## 7. Integracja API

- **Endpoint**: `POST /api/auth/reset-password`
- **Lokalizacja**: `src/pages/api/auth/reset-password.ts`
- **Request body**: `ResetPasswordRequest`
  ```json
  {
    "accessToken": "string (min 1 char)",
    "refreshToken": "string (min 1 char)",
    "newPassword": "string (min 6 chars)"
  }
  ```
- **Responses**:
  - `200 OK` `{ message: 'Password updated successfully' }`
  - `400 Bad Request` – Invalid JSON or validation errors
  - `422 Unprocessable Entity` – Invalid or expired token: `{ error: 'Token nieważny lub wygasł...' }`
  - `500 Internal Server Error` – Unexpected errors
  - `503 Service Unavailable` – Feature disabled: `FEATURE_DISABLED`

- **Backend flow**:
  1. Feature flag check (`isEnabled("auth")`)
  2. Parse & validate request body z `ResetPasswordSchema` (Zod)
  3. `supabase.auth.setSession({ access_token, refresh_token })` – weryfikuje tokeny
  4. `supabase.auth.updateUser({ password: newPassword })` – aktualizuje hasło
  5. Zwraca sukces lub odpowiedni błąd

- **RTK Query**: 
  ```typescript
  resetPassword: builder.mutation<{ message: string }, ResetPasswordRequest>
  ```
- **Hook**: `useResetPasswordMutation()` – eksportowany z `apiSlice.ts`.

## 8. Interakcje użytkownika

| Akcja                                    | Rezultat                                                                           |
| ---------------------------------------- | ---------------------------------------------------------------------------------- |
| Wejście na stronę z poprawnymi tokenami  | `ResetPasswordPage` ekstrahuje tokeny, renderuje formularz                        |
| Wejście na stronę bez tokenów            | Komunikat "Link jest nieprawidłowy. Przekierowywanie..." + redirect po 2s         |
| Uzupełnienie obu pól zgodnie z walidacją | Pola disabled gdy `isLoading`, błędy inline przy `onBlur`                          |
| Błąd walidacji (hasła nie pasują)        | Komunikat pod polem `confirmPassword`: "Hasła muszą być identyczne"               |
| Kliknięcie „Zmień hasło"                 | `isLoading = true`, przycisk pokazuje "Zapisywanie..." + spinner, pola disabled   |
| Sukces                                   | Toast "Hasło zostało zmienione", redirect do `/` (strona główna)                  |
| Błąd 422 (invalid token)                 | Toast z błędem: "Token nieważny lub wygasł..."                                     |
| Błąd walidacji backend (400)             | Toast z błędem zwróconym przez API                                                 |
| Błąd sieci / 500                         | Toast "Nie udało się zresetować hasła" (fallback message)                         |

## 9. Warunki i walidacja

### Client-side (ResetPasswordPage)

- Ekstrahuje `access_token` i `refresh_token` z `window.location.hash`
- Jeśli brak któregokolwiek tokenu → `setError(true)` + redirect do `/forgot-password` po 2 sekundach

### Client-side (ResetPasswordForm)

- Walidacja przez Zod schema z `react-hook-form`:
  1. `newPassword.length >= 6` – "Password must be at least 6 characters"
  2. `confirmPassword === newPassword` – "Hasła muszą być identyczne"
- Walidacja uruchamiana `onBlur` (mode: "onBlur")
- Błędy wyświetlane inline pod polami

### Backend (API endpoint)

- Feature flag: `isEnabled("auth")` – jeśli wyłączona, zwraca 503
- Walidacja przez `ResetPasswordSchema`:
  1. `accessToken` – min 1 znak, required
  2. `refreshToken` – min 1 znak, required
  3. `newPassword` – min 6 znaków, required
- Weryfikacja tokenów przez `supabase.auth.setSession()`
- Aktualizacja hasła przez `supabase.auth.updateUser()`

## 10. Obsługa błędów

### Client-side (przed wysłaniem requesta)

- **Brak tokenów w URL**: Komunikat "Link jest nieprawidłowy. Przekierowywanie..." + redirect do `/forgot-password` po 2s
- **Walidacja formularza**: Błędy inline pod polami (react-hook-form + Zod)

### API response errors

- **400 Bad Request** (Validation): Toast z błędem zwróconym przez API (np. formatowanie błędów walidacji)
- **422 Unprocessable Entity** (Invalid/expired token): Toast "Token nieważny lub wygasł..."
- **500 Internal Server Error**: Toast z fallback message "Nie udało się zresetować hasła"
- **503 Service Unavailable** (Feature disabled): Toast z informacją o wyłączonej funkcjonalności

### Network errors

- **Brak połączenia**: RTK Query catch block → toast "Nie udało się zresetować hasła"

### Backend error handling

- **ValidationError**: Zwraca sformatowane błędy walidacji z Zod
- **HttpError**: Mapowanie błędów Supabase na odpowiednie response codes i messages
- **Unexpected errors**: Log do konsoli + response 500 "Internal server error"

## 11. Kroki implementacji (zakończone)

### Zrealizowane

1. **Backend API endpoint** ✅
   - Utworzono `src/pages/api/auth/reset-password.ts`
   - Implementacja z `ResetPasswordSchema` (Zod validation)
   - Obsługa setSession + updateUser przez Supabase
   - Error handling z `ValidationError` i `HttpError`
   - Feature flag check

2. **Validation schemas** ✅
   - Dodano `ResetPasswordSchema` do `src/lib/validation/auth.ts`
   - Server-side walidacja accessToken, refreshToken, newPassword

3. **Types/DTOs** ✅
   - Dodano `ResetPasswordRequest` do `src/types.ts` z trzema polami (accessToken, refreshToken, newPassword)

4. **RTK Query mutation** ✅
   - Dodano `resetPassword` mutation do `src/store/api/apiSlice.ts`
   - Implementacja `onQueryStarted` z toast notifications
   - Redirect do `/` po sukcesie
   - Hook `useResetPasswordMutation()` dostępny

5. **Komponent ResetPasswordPage** ✅
   - Utworzono `src/components/pages/ResetPasswordPage.tsx`
   - Ekstrahuje tokeny z `window.location.hash` w `useEffect`
   - Zarządza stanem: `tokens`, `error`
   - Przekierowuje do `/forgot-password` po 2s gdy brak tokenów
   - Owinięty przez `withProviders` HOC

6. **Komponent ResetPasswordForm** ✅
   - Utworzono `src/components/forms/ResetPasswordForm.tsx`
   - Używa `react-hook-form` + `zodResolver` + Zod `ClientSchema`
   - Dwa pola: `newPassword`, `confirmPassword` z `showPasswordToggle`
   - Walidacja: min 6 znaków + hasła muszą być identyczne (`.refine()`)
   - Mode: `onBlur`
   - Props: `{ accessToken, refreshToken }`

7. **Strona Astro** ✅
   - Utworzono `src/pages/reset-password.astro`
   - Prosty wrapper z `<Layout>` + `<ResetPasswordPage client:load />`
   - `export const prerender = false`

8. **UI Components** ✅
   - Wykorzystano istniejące: `FormInput`, `SubmitButton`, `@radix-ui/react-form`
   - Toast notifications przez `toastSlice` (globalny)

### Uwagi implementacyjne

- **Zmiana względem planu**: Tokeny przekazywane przez hash fragment zamiast query params (standard Supabase)
- **Zmiana względem planu**: Walidacja tokenów client-side zamiast SSR (wymóg hash fragment)
- **Zmiana względem planu**: Redirect do `/` zamiast `/login` po sukcesie
- **Rozszerzenie**: Dodano `showPasswordToggle` w polach hasła
- **Rozszerzenie**: `withProviders` HOC dla dostępu do Redux/Toast
