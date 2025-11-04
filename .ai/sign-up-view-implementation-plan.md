# Plan implementacji widoku Sign Up

## 1. Przegląd
Widok **Sign Up** umożliwia nowym użytkownikom rejestrację w aplikacji Definition Quest poprzez podanie adresu e-mail, hasła oraz nazwy wyświetlanej (display name). Formularz waliduje dane po stronie klienta (Zod + React Hook Form), wywołuje endpoint `POST /api/auth/signUp`, a po sukcesie przekierowuje użytkownika do strony logowania lub automatycznie loguje – zgodnie z przyjętą logiką backendu. Błędy i komunikaty sukcesu prezentowane są w globalnym systemie toastów.

## 2. Routing widoku
| Ścieżka | Komponent strony | Dostęp |
|---------|-----------------|--------|
| `/signup` | `src/components/pages/SignUpPage.tsx` | Publiczny (nielogowani i wylogowani)

## 3. Struktura komponentów
```
<SignUpPage>
  └─ <Providers> (kontexty redux / toast / theme itd.)
      └─ <SignUpForm>
          ├─ <Form.Field name="email"> <input/> </Form.Field>
          ├─ <Form.Field name="displayName"> <input/> </Form.Field>
          ├─ <Form.Field name="password"> <input type={showPwd?text:password}/> <EyeIcon/> </Form.Field>
          ├─ <Form.Field name="repeatPassword"> <input type={showPwd?text:password}/> </Form.Field>
          └─ <Form.Submit> <Button/> </Form.Submit>
```

## 4. Szczegóły komponentów
### 4.1 `SignUpPage`
- **Opis**: Strona–kontener odpowiadająca za wyśrodkowanie formularza na ekranie oraz zapewnienie spójnego tła/kolorystyki (tak jak `LoginPage`).
- **Główne elementy**: nagłówek aplikacji, komponent `SignUpForm`, link CTA do `/login`.
- **Obsługiwane interakcje**: brak logiki biznesowej – deleguje wszystko do `SignUpForm`.
- **Propsy**: brak.

### 4.2 `SignUpForm`
- **Opis**: Zawiera właściwy formularz rejestracji oparty na `@radix-ui/react-form`, `react-hook-form`, `zodResolver` oraz przycisku z Shadcn/ui.
- **Główne elementy HTML / dzieci**:
  - 4 pola `<input>` (`email`, `displayName`, `password`, `repeatPassword`) z etykietami i walidacją inline.
  - Ikona oka pozwalająca chwilowo odsłonić hasło (identyczna implementacja jak w `AuthForm`).
  - Przycisk submit.
- **Obsługiwane interakcje**:
  1. Wpisywanie w pola – aktualizacja stanu formularza.
  2. Kliknięcie ikony oka – przełącza `showPwd`.
  3. Submit – `handleSubmit(onSubmit)` wysyła dane do API.
- **Walidacja**:
  - `email`: prawidłowy e-mail (`z.string().email`).
  - `password`: min 6 znaków.
  - `repeatPassword`: musi być identyczne jak `password` (schema `.refine`).
  - `displayName`: 1–40 znaków, nie-pusty.
- **Typy**:
  - `SignUpFormData` = `z.infer<typeof SignUpSchema>`.
  - `SignUpRequest`, `AuthResponse` (z `src/types.ts`).
- **Propsy**: brak (formularz samodzielny).

## 5. Typy
```ts
// src/components/forms/SignUpForm.tsx
export type SignUpFormData = z.infer<typeof SignUpSchema>;
```
Wykorzystuje istniejące:
* `SignUpRequest` – wysyłane w mutacji RTKQ.
* `AuthResponse` – odpowiedź z API.

## 6. Zarządzanie stanem
| Stan | Lokalizacja | Typ | Opis |
|------|-------------|-----|------|
| błędy walidacji | `react-hook-form` | lokalny | Wyświetlane pod polami.
| `showPwd` | `useState<boolean>` | lokalny | Pokazuje/ukrywa hasło przy przytrzymaniu ikony oka.
| isLoading | zwracany z `useSignUpMutation` | lokalny | Blokuje pola i przycisk podczas requestu.
| globalne toasty | `toastSlice` | Redux | Sukces / błąd API.

(Brak potrzeby custom hooku – logika jest prosta; opcjonalnie można wyekstrahować `usePasswordVisibility`).

## 7. Integracja API
- Mutacja: `useSignUpMutation` z `apiSlice`.
```ts
const [signUp, { isLoading }] = useSignUpMutation();
...
await signUp(data).unwrap();
```
- Request body: `SignUpRequest` `{ email, password, displayName }` – `repeatPassword` służy wyłącznie walidacji frontowej, nie jest wysyłane.
- Odpowiedź sukcesu: `AuthResponse` – wykorzystujemy `message` do toastów.
- Statusy błędów do obsługi: `400`, `409 (EMAIL_ALREADY_EXISTS)`, `500`.

## 8. Interakcje użytkownika
| Akcja | Rezultat |
|-------|----------|
| Wprowadza niepoprawny e-mail | Natychmiast komunikat walidacji.
| Hasło < 6 znaków | Komunikat walidacji.
| Klik „Zarejestruj” z błędnymi danymi | Formularz blokuje submit, pokazuje lokalne błędy.
| Click „Zarejestruj” (OK) | Przycisk pokazuje spinner, wysyłka; po 201 → toast sukcesu + przekierowanie `/login`.
| API zwraca 409 | Toast error „Email already exists”.
| Dowolny inny błąd sieci | Toast error ogólny.

## 9. Warunki i walidacja
| Warunek | Komponent | Działanie UI |
|---------|-----------|--------------|
| `email` nie spełnia `.email()` | `SignUpForm` | czerwony border + message.
| `password.length < 6` | `SignUpForm` | jw.
| `displayName` pusty lub > 40 | `SignUpForm` | jw.
| `repeatPassword` ≠ `password` | `SignUpForm` | jw.
| API 409 | global toast error.

## 10. Obsługa błędów
1. **Walidacja kliencka** – blokuje submit, pokazuje inline.
2. **Błędy API** – przechwycone w `onQueryStarted`; dispatch `showToast` z treścią serwera lub ogólną.
3. **Sieć offline** – RTKQ daje `error.status === "FETCH_ERROR"`; prezentujemy toast.

## 11. Kroki implementacji
1. **Utwórz plik** `src/components/pages/SignUpPage.tsx` kopiując styl z `LoginPage` (zmień tytuł przycisku, dodaj link do „Masz konto? Zaloguj się”).
2. **Utwórz komponent** `src/components/forms/SignUpForm.tsx`;
   - skopiuj `AuthForm`, zmień import schematu na `SignUpSchema` i dołącz pole `displayName`.
   - użyj `useSignUpMutation` zamiast `useLoginMutation`.
3. **Dodaj routing** w `src/pages/signup.astro` (lub `/pages/signup.astro` jeśli generujemy przez Astro):
```astro
---
import SignUpPage from "../components/pages/SignUpPage";
---
<SignUpPage />
```
4. **Aktualizuj nawigację** (jeśli istnieje) – dodaj odnośnik do `/signup` na stronie logowania.
5. **Testuj scenariusze**:
   - poprawna rejestracja (201) → toast sukcesu i przekierowanie,
   - e-mail zajęty (409) → toast error,
   - walidacja pól.
6. **Dodaj testy jednostkowe** (opcjonalne) dla `SignUpForm` (React Testing Library + Vitest) – sprawdź walidację i request.
7. **Lint / prettier / commit**.
