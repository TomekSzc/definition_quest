# Plan implementacji widoku Forgot Password

## 1. Przegląd

Strona **Forgot Password** umożliwia użytkownikom wysłanie żądania resetu hasła. Użytkownik wprowadza swój adres e-mail, a aplikacja – niezależnie od tego, czy podany adres istnieje w bazie – zwraca komunikat sukcesu i instruuje o sprawdzeniu skrzynki odbiorczej (security best practice).

Widok jest częścią publicznej sekcji aplikacji (brak wymogu autentykacji) i wykorzystuje:

- **React Hook Form** z **Zod** do zarządzania stanem formularza i walidacji
- **RTK Query** (`useForgotPasswordMutation`) do komunikacji z API
- **Redux Toolkit** (`showToast`) do wyświetlania komunikatów
- **Radix UI** (`@radix-ui/react-form`) jako podstawa formularza
- **Supabase Auth** (`resetPasswordForEmail`) na backendzie do wysyłania linków resetujących

Po wysłaniu formularza, input i przycisk pozostają zablokowane (`disabled`) aby zapobiec wielokrotnemu wysyłaniu.

## 2. Routing widoku

- Ścieżka: `/forgot-password`
- Plik Astro strony: `src/pages/forgot-password.astro`
- Widok nie jest chroniony przez `ProtectedRoute` – dostępny dla wszystkich.

## 3. Struktura komponentów

```
src/pages/forgot-password.astro
└── ForgotPasswordPage (React Island, client:load)
    └── withProviders(ForgotPasswordPageComponent) - HOC dla Redux/React Query
        ├── h1 "Definition quest"
        ├── ForgotPasswordForm
        │   └── @radix-ui/react-form (Form.Root)
        │       ├── FormInput (email, z react-hook-form register)
        │       └── SubmitButton (Radix Form.Submit asChild)
        └── Link "Pamiętasz hasło? Zaloguj się"

ToastContainer (globalny, istnieje w Layout – używany przez mutację)
```

## 4. Szczegóły komponentów

### 4.1. `ForgotPasswordPage`

- **Opis**: Komponent‐kontener renderowany w wyspie React; otacza formularz pełnym layoutem strony. Wrapped przez HOC `withProviders` zapewniający dostęp do Redux Store i React Query.
- **Główne elementy**:
  - Nagłówek `h1` ("Definition quest")
  - `ForgotPasswordForm`
  - Link powrotny "Pamiętasz hasło? Zaloguj się" prowadzący do `/login`
- **Layout**: Centrowany na ekranie (`min-h-screen flex flex-col items-center justify-center`) z tłem primary color.
- **Obsługiwane interakcje**: brak (cała logika w formularzu).
- **Walidacja**: n/d.
- **Typy**: n/d.
- **Propsy**: brak.
- **HOC**: Opakowany przez `withProviders` dla dostępu do Reduxowego store.

### 4.2. `ForgotPasswordForm`

- **Opis**: Formularz z pojedynczym polem e-mail i przyciskiem „Wyślij link". Wykorzystuje `react-hook-form` z `zodResolver` do zarządzania stanem i walidacji.
- **Główne elementy**:
  - `@radix-ui/react-form` jako wrapper formularza
  - `FormInput` (type="email", label="Email", disabled podczas loading i po sukcesie)
  - `SubmitButton` (disabled podczas loading i po sukcesie, pokazuje spinner)
- **Obsługiwane interakcje**:
  1. `onBlur` pola e-mail – walidacja przez `react-hook-form` z `ForgotPasswordSchema`.
  2. `onSubmit` formularza – wywołuje mutację RTK Query `useForgotPasswordMutation()`.
- **Walidacja**:
  - Klient: Zod schema `ForgotPasswordSchema` – poprawny format e-mail (niepuste, valid email format).
  - Mode: `onBlur` – walidacja uruchamiana po opuszczeniu pola.
  - Serwer: endpoint zawsze zwraca 200 (security best practice).
- **Typy**:
  - `ForgotPasswordRequest` (z `src/types.ts`) – typ dla request body.
  - `ForgotPasswordFormData` – `z.infer<typeof ForgotPasswordSchema>` – typ danych formularza.
  - `AuthResponse` – typ odpowiedzi z API.
- **Propsy**: brak (samodzielny komponent).
- **Stan mutacji**: `isLoading`, `isSuccess` z `useForgotPasswordMutation()`.
- **Styling**: Karta z białym borderem na primary background, max-width-md, centrowana.

## 5. Typy

1. **DTO** – `ForgotPasswordRequest` z `src/types.ts`: `{ email: string }`.
2. **Form Data** – `ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>` – typ inferred z schematu Zod.
3. **Validation Schema** – `ForgotPasswordSchema` z `src/lib/validation/auth.ts`:
   ```ts
   z.object({
     email: z.string().email("Invalid email format"),
   });
   ```
4. **RTK Query response type** – `AuthResponse` z `types.ts` (zawiera opcjonalne `message`).

## 6. Zarządzanie stanem

- **Lokalny**: `react-hook-form` w `ForgotPasswordForm` zarządza stanem formularza (pole `email`, błędy walidacji).
  - `useForm<ForgotPasswordFormData>` z `zodResolver(ForgotPasswordSchema)` i trybem `mode: "onBlur"`.
- **Stan mutacji**: `isLoading`, `isSuccess` z `useForgotPasswordMutation()` – używane do disabled state pól i przycisku.
- **Globalny**: wykorzystujemy istniejący slice `toast` do komunikatów sukcesu/błędu (wywoływany w `onQueryStarted` mutacji).
- **Custom hook**: nie używamy custom hooka – bezpośrednie użycie `useForgotPasswordMutation()`.

## 7. Integracja API

- **RTK Query** – mutacja `forgotPassword` w `apiSlice.ts` (zaimplementowana):
  ```ts
  forgotPassword: builder.mutation<AuthResponse, ForgotPasswordRequest>({
    query: (body) => ({
      url: "/api/auth/forgot-password",
      method: "POST",
      body,
    }),
    async onQueryStarted(_, { dispatch, queryFulfilled }) {
      try {
        await queryFulfilled;
        dispatch(
          showToast({
            type: "success",
            title: "Sprawdź skrzynkę",
            message: "Wysłaliśmy link resetujący hasło.",
          })
        );
      } catch (err: unknown) {
        const errorMessage =
          (err as { error?: { data?: { error?: string } } }).error?.data?.error ?? "Coś poszło nie tak";
        dispatch(showToast({ type: "error", title: "Błąd", message: errorMessage }));
      }
    },
  });
  ```
- **Hook**: `useForgotPasswordMutation()` – eksportowany z `apiSlice.ts`.
- **Request body**: `{ email: string }`.
- **Response**: Zawsze `200 OK` + `{ message: string }` (security best practice – nie ujawniamy, czy email istnieje).
- **Backend endpoint**: `POST /api/auth/forgot-password` – używa `Supabase.auth.resetPasswordForEmail()` z redirectTo `${origin}/reset-password`.

## 8. Interakcje użytkownika

| Interakcja                              | Wynik                                                                                          |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Wpisuje e-mail                          | Stan `email` zarządzany przez `react-hook-form`.                                               |
| Opuszcza pole e-mail (blur)             | Walidacja Zod – błędy wyświetlane inline pod polem jeśli niepoprawny format.                   |
| Klik „Wyślij link" z poprawnym e-mailem | `isLoading = true` → mutacja `forgotPassword` → disabled input & button + spinner w przycisku. |
| Sukces odpowiedzi                       | `isSuccess = true` → Toast _success_ + input i button pozostają disabled.                      |
| Błąd sieci/serwera                      | Toast _error_ z komunikatem błędu.                                                             |
| Klik na link "Zaloguj się"              | Przekierowanie do `/login` (Routes.Login).                                                     |

## 9. Warunki i walidacja

| Warunek             | Komponent            | Zachowanie                                                                    |
| ------------------- | -------------------- | ----------------------------------------------------------------------------- |
| `email` pusty       | `ForgotPasswordForm` | Brak błędu, ale `react-hook-form` nie pozwoli na submit (nieprawidłowy stan). |
| `email` niepoprawny | `ForgotPasswordForm` | Błąd walidacji "Invalid email format" wyświetlony inline pod polem (onBlur).  |
| Loading state       | `FormInput`          | Input disabled.                                                               |
| Loading state       | `SubmitButton`       | Spinner + disabled + tekst "Wysyłanie...".                                    |
| Success state       | `FormInput`          | Input disabled (pozostaje disabled po sukcesie).                              |
| Success state       | `SubmitButton`       | Disabled (pozostaje disabled po sukcesie).                                    |
| Schema Zod          | `ForgotPasswordForm` | `z.string().email("Invalid email format")` – walidacja formatu email.         |

## 10. Obsługa błędów

1. **Walidacja klienta** – błędy inline pod polem (zarządzane przez `react-hook-form` i Zod schema).
2. **Błąd sieci/serwera** – toast _error_ z komunikatem błędu (lub fallback "Coś poszło nie tak").
3. **Timeout** – RTK Query zwróci error → toast _error_.
4. **Typ błędu** – silne typowanie błędów w `catch` block: `err as { error?: { data?: { error?: string } } }`.

## 11. Kroki implementacji (wykonane)

### ✅ Zrealizowane:

1. **Routing**: ✅ Utworzono `src/pages/forgot-password.astro` z React Island renderującym `ForgotPasswordPage` z `client:load`.
2. **Schema walidacji**: ✅ Dodano `ForgotPasswordSchema` w `src/lib/validation/auth.ts`.
3. **Mutacja RTK**: ✅ Dodano mutację `forgotPassword` do `apiSlice.ts` z handlerem toast w `onQueryStarted`.
4. **Hook eksport**: ✅ Wyeksportowano `useForgotPasswordMutation` z `apiSlice.ts`.
5. **Komponent formy**:
   - ✅ Utworzono `src/components/forms/ForgotPasswordForm.tsx`.
   - ✅ Użyto `react-hook-form` z `zodResolver(ForgotPasswordSchema)` i trybem `onBlur`.
   - ✅ Wykorzystano `@radix-ui/react-form` jako wrapper.
   - ✅ Użyto `FormInput` (z disabled podczas loading i success).
   - ✅ Użyto `SubmitButton` (z spinner, disabled podczas loading i success, zmiana tekstu).
6. **Toast**: ✅ Wykorzystano `showToast` w `onQueryStarted` – sukces i błędy.
7. **Strona**:
   - ✅ Utworzono `ForgotPasswordPage.tsx` w `src/components/pages`.
   - ✅ Opakowano komponent HOC `withProviders` dla dostępu do Redux Store.
   - ✅ Dodano pełny layout: tytuł "Definition quest", formularz, link "Zaloguj się".
8. **Styling**: ✅ Zachowano spójność z widokami auth – Tailwind classes, primary background, biały border.
9. **Backend endpoint**: ✅ `POST /api/auth/forgot-password` w `src/pages/api/auth/forgot-password.ts` używa Supabase Auth.

### Architektura końcowa:

- **Strona Astro**: `src/pages/forgot-password.astro`
- **Page Component**: `src/components/pages/ForgotPasswordPage.tsx` (z HOC `withProviders`)
- **Form Component**: `src/components/forms/ForgotPasswordForm.tsx` (react-hook-form + Zod)
- **Validation**: `src/lib/validation/auth.ts` (`ForgotPasswordSchema`)
- **API Mutation**: `src/store/api/apiSlice.ts` (`forgotPassword`, `useForgotPasswordMutation`)
- **Backend**: `src/pages/api/auth/forgot-password.ts` (Supabase Auth integration)
- **Types**: `src/types.ts` (`ForgotPasswordRequest`, `AuthResponse`)
