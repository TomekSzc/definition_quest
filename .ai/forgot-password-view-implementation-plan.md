# Plan implementacji widoku Forgot Password

## 1. Przegląd
Strona **Forgot Password** umożliwia użytkownikom wysłanie żądania resetu hasła. Użytkownik wprowadza swój adres e-mail, a aplikacja – niezależnie od tego, czy podany adres istnieje w bazie – zwraca komunikat sukcesu i instruuje o sprawdzeniu skrzynki odbiorczej. Widok jest częścią publicznej sekcji aplikacji (brak wymogu autentykacji) i wykorzystuje istniejącą infrastrukturę RTK Query, Redux Toolkit oraz komponent `ToastContainer`.

## 2. Routing widoku
- Ścieżka: `/forgot-password`
- Plik Astro strony: `src/pages/forgot-password.astro`
- Widok nie jest chroniony przez `ProtectedRoute` – dostępny dla wszystkich.

## 3. Struktura komponentów
```
ForgotPasswordPage (React Island w Astro)
├── ForgotPasswordForm
└── ToastContainer (globalny, już istnieje w Layout)
```

## 4. Szczegóły komponentów
### 4.1. `ForgotPasswordPage`
- **Opis**: Komponent‐kontener renderowany w wyspie React; otacza formularz prostym układem/tytułem.
- **Główne elementy**: nagłówek `h1` („Resetuj hasło”), `ForgotPasswordForm`.
- **Obsługiwane interakcje**: brak (cała logika w formularzu).
- **Walidacja**: n/d.
- **Typy**: n/d.
- **Propsy**: brak.

### 4.2. `ForgotPasswordForm`
- **Opis**: Formularz z pojedynczym polem e-mail i przyciskiem „Wyślij link”.
- **Główne elementy**: 
  - `FormInput` (type="email", label="Email")
  - `SubmitButton` (disabled na czas zapytania)
- **Obsługiwane interakcje**:
  1. `onChange` pola e-mail – aktualizuje lokalny stan `email`.
  2. `onSubmit` formularza – wywołuje mutację RTK Query.
- **Walidacja**:
  - Klient: RegExp/Zod – poprawny format e-mail (niepuste, valid email).
  - Serwer: brak różnic (endpoint zawsze zwraca 200).
- **Typy**:
  - `ForgotPasswordRequest` (z `src/types.ts`).
  - `ForgotPasswordFormState` *(ViewModel)*:
    ```ts
    interface ForgotPasswordFormState {
      email: string;
    }
    ```
- **Propsy**: brak (samodzielny komponent).

## 5. Typy
1. **DTO** – już istnieje: `ForgotPasswordRequest` `{ email: string }`.
2. **ViewModel** – `ForgotPasswordFormState` opisany powyżej.
3. **RTK Query response type** – użyj `AuthResponse` z `types.ts` (komunikat).

## 6. Zarządzanie stanem
- **Lokalny**: `useState` w `ForgotPasswordForm` dla pola `email`.
- **Globalny**: brak nowego stanu; wykorzystujemy istniejący slice `toast` do komunikatów.
- **Custom hook**: `useForgotPassword` (opcjonalny wrapper nad mutacją), ale prostsze będzie użycie mutacji bezpośrednio.

## 7. Integracja API
- **RTK Query** – dodać mutację `forgotPassword` w `apiSlice`:
  ```ts
  forgotPassword: builder.mutation<AuthResponse, ForgotPasswordRequest>({
    query: (body) => ({
      url: "/api/auth/forgot-password",
      method: "POST",
      body,
    }),
    onQueryStarted: async (_, { dispatch, queryFulfilled }) => {
      try {
        await queryFulfilled;
        dispatch(showToast({
          type: "success",
          title: "Sprawdź skrzynkę",
          message: "Wysłaliśmy link resetujący hasło.",
        }));
      } catch (err) {
        dispatch(showToast({
          type: "error",
          title: "Błąd",
          message: err.error?.data?.error || "Coś poszło nie tak",
        }));
      }
    },
  })
  ```
- **Request body**: `{ email }`.
- **Response**: `200 OK` + `{ message: string }` (ignorowany, bo zawsze 200).

## 8. Interakcje użytkownika
| Interakcja | Wynik |
|-----------|-------|
| Wpisuje e-mail | Stan `email` uaktualniony, walidacja on-change. |
| Klik „Wyślij link” z poprawnym e-mailem | Mutacja `forgotPassword` → disabled button + spinner. |
| Sukces odpowiedzi | Toast *success*, opcjonalnie route push do `/signin`. |
| Błąd sieci | Toast *error*. |

## 9. Warunki i walidacja
| Warunek | Komponent | Zachowanie |
|----------|-----------|-----------|
| `email` pusty | `ForgotPasswordForm` | Przyciski disabled, komunikat „Wprowadź email”. |
| `email` niepoprawny | `ForgotPasswordForm` | Błąd walidacji pod polem, brak requestu. |
| Loading state | `SubmitButton` | Spinner + disabled. |

## 10. Obsługa błędów
1. **Walidacja klienta** – informacja inline.
2. **Błąd sieci/serwera** – toast *error* z ogólnym komunikatem.
3. **Timeout** – RTK Query zwróci error → toast.

## 11. Kroki implementacji
1. **Routing**: Utwórz plik `src/pages/forgot-password.astro` i zaimplementuj React Island z `ForgotPasswordPage`.
2. **Mutacja RTK**: Dodaj `forgotPassword` do `apiSlice.ts`.
3. **Komponent formy**:
   1. Stwórz `src/components/forms/ForgotPasswordForm.tsx` inspirując się `AuthForm`.
   2. Użyj `FormInput` oraz `SubmitButton`.
   3. Dodaj lokalną walidację (Zod + `zodResolver` z `react-hook-form` lub prosty regex – zgodnie ze stylem projektu).
4. **Toast**: Wykorzystaj istniejące akcje `showToast` w `onQueryStarted`.
5. **Strona**: Utwórz `ForgotPasswordPage.tsx` (wrapper) w `src/components/pages`.
6. **Styling**: Zachowaj spójność z widokami Login/Sign Up – Tailwind utility classes.
7. **Testy manualne**: 
   - Pusty e-mail → blokada.
   - Niepoprawny e-mail → błąd inline.
   - Poprawny e-mail → toast success.
   - Sieć offline → toast error.
8. **QA/a11y**: 
   - `aria-label` na input.
   - Możliwość wysłania formularza klawiszem *Enter*.
   - Focus management po toast.
9. **Dokumentacja**: Zaktualizuj README sekcję „Auth” + `.ai/ui-plan.md` w razie potrzeby.
