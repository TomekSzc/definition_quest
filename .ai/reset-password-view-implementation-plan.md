# Plan implementacji widoku Reset Password

## 1. Przegląd
Widok „Reset Password” umożliwia użytkownikowi ustawienie nowego hasła po kliknięciu linku otrzymanego e-mailem. Link otwiera stronę pod ścieżką `/reset-password` z parametrami `token=<jwt>` oraz `type=recovery`. Token jest weryfikowany po stronie serwera (SSR) przed renderowaniem strony. Jeśli token jest nieprawidłowy lub wygasł, użytkownik zostanie przekierowany do widoku „Forgot Password”. Po pozytywnym ustawieniu hasła użytkownik otrzymuje informację o sukcesie w postaci toastu i może przejść do logowania.

## 2. Routing widoku
- **Plik strony**: `src/pages/reset-password.astro`
- **Ścieżka URL**: `/reset-password`
- **Query params**: `token` (JWT), `type` (musi równać się `recovery`)
- **SSR Guard**: Sprawdza obecność i poprawność tokenu poprzez `supabase.auth.getUser()`; w przypadku braku lub błędu – `redirect('/forgot-password')`.

## 3. Struktura komponentów
```
ResetPasswordPage (Astro)
└── ResetPasswordForm (React)
    ├── FormInput (2× – newPassword, confirmPassword)
    ├── SubmitButton
    └── ToastContainer (portal – globalny)
```

## 4. Szczegóły komponentów
### ResetPasswordPage
- **Opis**: Strona Astro odpowiedzialna za SSR weryfikację tokenu i osadzenie formularza.
- **Główne elementy**: `<ResetPasswordForm />`, `<Toast />` (jeżeli globalne to w `Providers`), nagłówek H1.
- **Obsługiwane interakcje**: Brak bezpośrednich, wszystkie obsługuje formularz.
- **Walidacja**: SSR – prawidłowość tokenu, obecność parametru `type=recovery`.
- **Typy**: Brak własnych, używa Supabase typu `User`.
- **Propsy**: Brak / ewentualnie przekazuje `accessToken` lub flagę `tokenValid` do formularza, ale preferujemy bezpośredni dostęp do `supabase` w SSR.

### ResetPasswordForm
- **Opis**: Formularz React odpowiedzialny za przyjmowanie nowego hasła i przesyłanie go do API.
- **Główne elementy**:
  - Dwa pola `<FormInput type="password" />`:
    - `newPassword`
    - `confirmPassword`
  - `<SubmitButton />`
- **Obsługiwane interakcje**:
  - `onChange` aktualizuje lokalny state
  - `onSubmit` wywołuje mutację RTK Query `authApi.resetPassword`
- **Walidacja (client-side)**:
  1. `newPassword` ≥ 6 znaków
  2. `confirmPassword` musi być identyczne
  3. Blokada submit przy niepoprawnych polach
- **Typy**:
  - `ResetPasswordFormValues` – ViewModel formularza (patrz sekcja 5)
  - `ResetPasswordRequest` – DTO do API (z `src/types.ts`)
- **Propsy**: Żadne (formularz sam pobiera `token` z URL jeśli trzeba).

### ToastContainer (globalny)
- Już istnieje w `src/components/ui/Toast.tsx`, wykorzystywany przez `toastSlice`.

## 5. Typy
```ts
// ViewModel formularza
export interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}
```
- DTO do API już zdefiniowany: `ResetPasswordRequest { newPassword: string }`

## 6. Zarządzanie stanem
- Lokalny state w komponencie (`useState`) lub `react-hook-form` (jeśli używany w projekcie – tu zakładamy prosty `useState`).
- Globalny toast przez `toastSlice`.
- Mutacja API w `apiSlice.ts`:
  - Endpoint `resetPassword`: method POST `'/api/auth/reset-password'`
  - Po sukcesie: dispatch `showToast({ type: 'success', message: 'Hasło zostało zmienione.' })`, redirect do `/login`.
  - Po błędzie: dispatch `showToast({ type: 'error', message: errorMessage })`.

## 7. Integracja API
- **Endpoint**: `POST /api/auth/reset-password`
- **Request body**: `ResetPasswordRequest`
  ```json
  { "newPassword": "string (>=6)" }
  ```
- **Responses**:
  - `200 OK` `{ message: 'Password updated successfully' }`
  - `400 / 401 / 500` z opisem błędu `{ error: string }`
- **RTK Query**: dodać `resetPassword: builder.mutation<void, ResetPasswordRequest>`

## 8. Interakcje użytkownika
| Akcja | Rezultat |
|-------|----------|
| Uzupełnienie obu pól zgodnie z walidacją | Aktywuje przycisk „Zmień hasło” |
| Kliknięcie „Zmień hasło” | Pokazuje spinner, wysyła żądanie   |
| Sukces | Toast „Hasło zostało zmienione”, redirect do `/login` |
| Błąd walidacji backend | Pokazuje mapowane komunikaty obok pól / w toast |
| Błąd sieci / 500 | Toast „Wystąpił błąd serwera” |

## 9. Warunki i walidacja
- **SSR**: token + type === 'recovery'
- **Client**:
  1. `newPassword.length >= 6`
  2. `confirmPassword === newPassword`
  3. Token w URL nieobecny → soft-redirect `/forgot-password`

## 10. Obsługa błędów
- **400 Validation**: Wyświetlenie szczegółowych błędów zwróconych przez API przy polach.
- **401 INVALID_RESET_TOKEN**: Redirect `/forgot-password` + toast informacyjny.
- **500**: Globalny toast „Wystąpił nieoczekiwany błąd”.
- **Brak połączenia internetowego**: blokada przycisku, toast offline.

## 11. Kroki implementacji
1. **Routing i SSR Guard**
   - Utwórz plik `src/pages/reset-password.astro` z logiką SSR (sprawdzenie tokenu przez Supabase i redirect).
2. **Dodanie endpointu do RTK Query**
   - W `src/store/api/apiSlice.ts` dodaj `resetPassword` mutation.
3. **Komponent `ResetPasswordForm`**
   - Utwórz `src/components/forms/ResetPasswordForm.tsx` wg sekcji 4.
4. **Integracja formularza w stronie**
   - Zaimportuj i wyrenderuj `<ResetPasswordForm />` w `reset-password.astro`.
5. **Walidacja client-side**
   - Zaimplementuj funkcję `validate(values)` lub użyj `zod` + `zodResolver`.
6. **Toast i przekierowanie**
   - Na sukces → toast + `navigate('/login')`.
7. **Testy manualne**
   - Scenariusze: poprawny token, niepoprawny token, błędy walidacji, brak internetu.
8. **Doc i QA**
   - Aktualizacja README / Changelog, poproszenie QA o test.
