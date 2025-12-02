# Plan implementacji widoku Sign Up

## 1. Przegląd

Widok **Sign Up** umożliwia nowym użytkownikom rejestrację w aplikacji Definition Quest poprzez podanie nazwy wyświetlanej (display name), adresu e-mail oraz hasła (z potwierdzeniem). Formularz waliduje dane po stronie klienta (Zod + React Hook Form w trybie `onBlur`), wywołuje endpoint `POST /api/auth/signUp`, a po sukcesie przekierowuje użytkownika do strony logowania (`/login`). Błędy i komunikaty sukcesu prezentowane są w globalnym systemie toastów (Redux). Implementacja wykorzystuje reużywalne komponenty UI (`FormInput`, `SubmitButton`) oraz HOC `withProviders` do zapewnienia kontekstów Redux i innych.

## 2. Routing widoku

| Ścieżka   | Komponent strony                      | Dostęp                               |
| --------- | ------------------------------------- | ------------------------------------ |
| `/signup` | `src/components/pages/SignUpPage.tsx` | Publiczny (nielogowani i wylogowani) |

## 3. Struktura komponentów

```
<SignUpPage> (owrapowany przez withProviders HOC)
  └─ <SignUpForm>
      ├─ <FormInput name="displayName" showPasswordToggle={false} />
      ├─ <FormInput name="email" type="email" />
      ├─ <FormInput name="password" type="password" showPasswordToggle={true} />
      ├─ <FormInput name="repeatPassword" type="password" showPasswordToggle={true} />
      └─ <Form.Submit> <SubmitButton/> </Form.Submit>
```

## 4. Szczegóły komponentów

### 4.1 `SignUpPage`

- **Opis**: Strona–kontener odpowiadająca za wyśrodkowanie formularza na ekranie oraz zapewnienie spójnego tła/kolorystyki. Komponent jest owrapowany przez HOC `withProviders`, który dostarcza konteksty Redux, toast, theme itd.
- **Główne elementy**: nagłówek aplikacji "Definition quest", komponent `SignUpForm`, link CTA "Masz już konto? Zaloguj się" prowadzący do `/login`.
- **Obsługiwane interakcje**: brak logiki biznesowej – deleguje wszystko do `SignUpForm`.
- **Propsy**: brak.
- **Implementacja**: Znajduje się w `src/components/pages/SignUpPage.tsx` i jest eksportowany jako `SignUpPage = withProviders(SignUpPageComponent)`.

### 4.2 `SignUpForm`

- **Opis**: Zawiera właściwy formularz rejestracji oparty na `@radix-ui/react-form`, `react-hook-form`, `zodResolver` oraz reużywalnych komponentach UI (`FormInput`, `SubmitButton`).
- **Główne elementy HTML / dzieci**:
  - 4 komponenty `<FormInput>` (w kolejności: `displayName`, `email`, `password`, `repeatPassword`) z etykietami i walidacją inline.
  - Pola hasła (`password` i `repeatPassword`) mają włączony prop `showPasswordToggle`, który renderuje ikonę oka w komponencie `FormInput`.
  - Komponent `<SubmitButton>` z tekstem "Zarejestruj" (idle) / "Rejestracja..." (loading).
- **Obsługiwane interakcje**:
  1. Wpisywanie w pola – aktualizacja stanu formularza (react-hook-form).
  2. Kliknięcie/przytrzymanie ikony oka (w komponencie `FormInput`) – chwilowo pokazuje hasło.
  3. Submit – `handleSubmit(onSubmit)` wysyła dane do API i przekierowuje do `/login` po sukcesie.
- **Walidacja**:
  - Schema: `ClientSignUpSchema` (rozszerza backend `SignUpSchema` o `repeatPassword`).
  - `displayName`: min 1 znak, max 40 znaków, nie może być pusty.
  - `email`: prawidłowy format e-mail (`.email()`).
  - `password`: min 6 znaków.
  - `repeatPassword`: min 6 znaków + musi być identyczne jak `password` (`.refine`).
  - Mode: `onBlur` – walidacja uruchamiana po opuszczeniu pola.
- **Typy**:
  - `SignUpFormData` = `z.infer<typeof ClientSignUpSchema>`.
  - `SignUpRequest` (z `src/types.ts`) – używany do przygotowania payload (bez `repeatPassword`).
- **Propsy**: brak (formularz samodzielny).
- **Po sukcesie**: Wywołuje `window.location.assign(Routes.Login)` aby przekierować do strony logowania.

### 4.3 `FormInput`

- **Opis**: Reużywalny komponent do renderowania pól formularza z walidacją i opcjonalnym przełącznikiem widoczności hasła.
- **Lokalizacja**: `src/components/ui/FormInput.tsx`
- **Propsy**:
  - `name: string` – nazwa pola.
  - `label: string` – etykieta wyświetlana nad polem.
  - `register: UseFormRegisterReturn` – obiekt rejestracji z react-hook-form.
  - `error?: string` – komunikat błędu walidacji.
  - `type?: "text" | "email" | "password"` – typ pola (domyślnie "text").
  - `disabled?: boolean` – czy pole jest wyłączone.
  - `showPasswordToggle?: boolean` – czy pokazać ikonę oka dla pól hasła.
  - `dataTestId?: string` – identyfikator dla testów.
- **Stan lokalny**: `showPwd` – kontroluje czy hasło jest widoczne (przy przytrzymaniu ikony oka).
- **Interakcje**: Obsługa myszy i dotyku dla ikony oka (onMouseDown/Up/Leave, onTouchStart/End).

### 4.4 `SubmitButton`

- **Opis**: Reużywalny przycisk submit z obsługą stanu ładowania.
- **Lokalizacja**: `src/components/ui/SubmitButton.tsx`
- **Propsy**:
  - `idleText: string` – tekst wyświetlany gdy przycisk nie jest w stanie ładowania.
  - `loadingText: string` – tekst wyświetlany podczas ładowania.
  - `isLoading: boolean` – czy przycisk jest w stanie ładowania.
  - `disabled?: boolean` – dodatkowa kontrola wyłączenia przycisku.
  - `className?: string` – dodatkowe klasy CSS.
  - `onClick?: MouseEventHandler` – opcjonalny handler kliknięcia.
  - `dataTestId?: string` – identyfikator dla testów.
- **Zachowanie**: Przycisk jest automatycznie wyłączany gdy `isLoading` jest true.

## 5. Typy

```ts
// src/components/forms/SignUpForm.tsx
export type SignUpFormData = z.infer<typeof ClientSignUpSchema>;
```

```ts
// src/lib/schemas/auth.ts
export const ClientSignUpSchema = SignUpSchema.extend({
  repeatPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.repeatPassword, {
  path: ["repeatPassword"],
  message: "Passwords do not match",
});
```

Wykorzystuje istniejące:

- `SignUpRequest` – payload wysyłany w mutacji RTKQ (bez `repeatPassword`).
- `AuthResponse` – odpowiedź z API (wykorzystywana w apiSlice).

## 6. Zarządzanie stanem

| Stan            | Lokalizacja                    | Typ     | Opis                                                |
| --------------- | ------------------------------ | ------- | --------------------------------------------------- |
| błędy walidacji | `react-hook-form`              | lokalny | Wyświetlane przez `FormInput` pod polami.           |
| `showPwd`       | `useState` w `FormInput`       | lokalny | Pokazuje/ukrywa hasło przy przytrzymaniu ikony oka. |
| isLoading       | zwracany z `useSignUpMutation` | lokalny | Blokuje pola i przycisk podczas requestu.           |
| globalne toasty | `toastSlice`                   | Redux   | Sukces / błąd API – obsługiwane przez `apiSlice`.   |

**Uwaga**: Logika `showPwd` jest zaimplementowana wewnątrz komponentu `FormInput`, nie bezpośrednio w `SignUpForm`.

## 7. Integracja API

- **Mutacja**: `useSignUpMutation` z `src/store/api/apiSlice.ts`.
- **Endpoint**: `POST /api/auth/signUp`

```ts
const [signUp, { isLoading }] = useSignUpMutation();
...
const payload: SignUpRequest = {
  email: data.email,
  password: data.password,
  displayName: data.displayName,
};
await signUp(payload).unwrap();
window.location.assign(Routes.Login);
```

- **Request body**: `SignUpRequest` `{ email, password, displayName }` – `repeatPassword` służy wyłącznie walidacji frontowej i nie jest wysyłane do API.
- **Odpowiedź sukcesu**: `AuthResponse` – `message` jest wyświetlany w toaście sukcesu.
- **Obsługa toastów**: Zaimplementowana w `onQueryStarted` w `apiSlice`:
  - Sukces: Toast z message "Account created" (lub z serwera).
  - Błąd: Toast z komunikatem błędu z API lub "Sign up failed".
- **Obsługa błędów globalnych**: `baseQueryWithReauth` automatycznie wyświetla toasty dla błędów HTTP (oprócz 401).
- **Statusy błędów**: `400` (walidacja), `409` (EMAIL_ALREADY_EXISTS), `500` (błąd serwera).

## 8. Interakcje użytkownika

| Akcja                                        | Rezultat                                                                                            |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Wprowadza niepoprawny e-mail                 | Komunikat walidacji pojawia się po opuszczeniu pola (onBlur).                                       |
| Hasło < 6 znaków                             | Komunikat walidacji pojawia się po opuszczeniu pola (onBlur).                                       |
| Hasła nie pasują                             | Komunikat "Passwords do not match" przy polu `repeatPassword`.                                      |
| Przytrzymuje ikonę oka przy polu hasła       | Hasło staje się widoczne jako tekst; puszczenie ikony/opuszczenie kursora ukrywa hasło.             |
| Klik „Zarejestruj" z błędnymi danymi         | Formularz blokuje submit, pokazuje lokalne błędy walidacji.                                         |
| Click „Zarejestruj" (OK)                     | Przycisk pokazuje "Rejestracja...", wysyłka; po sukcesie → toast sukcesu + przekierowanie `/login`. |
| API zwraca 409                               | Toast error z komunikatem z API (np. "Email already exists").                                       |
| Dowolny inny błąd sieci lub API (oprócz 401) | Toast error z komunikatem z serwera lub ogólny "Sign up failed".                                    |

## 9. Warunki i walidacja

| Warunek                             | Komponent     | Działanie UI                                         |
| ----------------------------------- | ------------- | ---------------------------------------------------- |
| `email` nie spełnia `.email()`      | `FormInput`   | Czerwony border + message w prawym górnym rogu pola. |
| `password.length < 6`               | `FormInput`   | jw.                                                  |
| `displayName` nie spełnia walidacji | `FormInput`   | jw.                                                  |
| `repeatPassword` ≠ `password`       | `FormInput`   | jw. + message "Passwords do not match".              |
| API 409 lub inny błąd               | Toast (Redux) | Toast error z komunikatem z API.                     |

**Uwaga**: Walidacja uruchamiana jest w trybie `onBlur`, więc błędy pokazują się po opuszczeniu pola, nie w trakcie wpisywania.

## 10. Obsługa błędów

1. **Walidacja kliencka** – blokuje submit, pokazuje inline przez komponent `FormInput` (tryb `onBlur`).
2. **Błędy API** – przechwycone w `onQueryStarted` w `apiSlice`; automatyczny dispatch `showToast` z treścią z serwera (`error.data.message`) lub ogólnym komunikatem "Sign up failed".
3. **Błędy globalne HTTP** – obsługiwane przez `baseQueryWithReauth`, który automatycznie wyświetla toast dla wszystkich błędów oprócz 401 (linie 84-92 w `apiSlice.ts`).
4. **Sieć offline** – RTKQ zwraca błąd, który jest przechwytywany przez `baseQueryWithReauth` i wyświetlany jako toast.

## 11. Kroki implementacji (zrealizowane)

1. ✅ **Utworzono plik** `src/components/pages/SignUpPage.tsx`:
   - Komponent jest owrapowany przez HOC `withProviders`.
   - Zawiera nagłówek "Definition quest", `SignUpForm` i link "Masz już konto? Zaloguj się".
2. ✅ **Utworzono komponent** `src/components/forms/SignUpForm.tsx`:
   - Używa `ClientSignUpSchema` (rozszerzenie backend schema o `repeatPassword`).
   - Wykorzystuje reużywalne komponenty `FormInput` i `SubmitButton`.
   - Pola w kolejności: `displayName`, `email`, `password`, `repeatPassword`.
   - Walidacja w trybie `onBlur`.
   - Używa `useSignUpMutation` z `apiSlice`.
   - Po sukcesie wywołuje `window.location.assign(Routes.Login)`.

3. ✅ **Utworzono komponenty UI**:
   - `src/components/ui/FormInput.tsx` – reużywalny input z walidacją i opcjonalnym toggle dla hasła.
   - `src/components/ui/SubmitButton.tsx` – przycisk submit z obsługą stanu ładowania.

4. ✅ **Dodano routing** w `src/pages/signup.astro`:

   ```astro
   ---
   import SignUpPage from "../components/pages/SignUpPage";
   import Layout from "../layouts/Layout.astro";
   export const prerender = false;
   ---

   <Layout>
     <SignUpPage client:load />
   </Layout>
   ```

5. ✅ **Dodano mutację** `signUp` w `src/store/api/apiSlice.ts`:
   - Endpoint: `POST /api/auth/signUp`
   - Obsługa toastów w `onQueryStarted`.
   - Automatyczne wyświetlanie błędów przez `baseQueryWithReauth`.

6. ✅ **Utworzono schema** `ClientSignUpSchema` w `src/lib/schemas/auth.ts`:
   - Rozszerza backend `SignUpSchema` o `repeatPassword`.
   - Walidacja zgodności haseł przez `.refine()`.

## 12. Różnice względem planu początkowego

1. **Komponenty UI**: Zamiast kopiować `AuthForm`, utworzono reużywalne komponenty `FormInput` i `SubmitButton`, co poprawia modularność kodu.
2. **Schema**: Użyto `ClientSignUpSchema` zamiast bezpośrednio `SignUpSchema`, co czyni walidację bardziej elastyczną.
3. **Kolejność pól**: Zmieniono na `displayName` → `email` → `password` → `repeatPassword` (w planie było `email` → `displayName`...).
4. **Tryb walidacji**: Dodano `mode: "onBlur"` w `useForm`, co sprawia że walidacja uruchamia się po opuszczeniu pola.
5. **Layout wrapper**: Strona `signup.astro` używa komponentu `Layout` i dyrektywy `client:load`.
6. **Obsługa błędów**: Zaimplementowano globalne przechwytywanie błędów w `baseQueryWithReauth`, które automatycznie wyświetla toasty dla wszystkich błędów HTTP (oprócz 401).
