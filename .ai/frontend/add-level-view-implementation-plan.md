# Plan implementacji widoku Dodaj poziom (Add Level View)

## 1. Przegląd

Widok umożliwia właścicielowi istniejącej planszy (board) dodanie kolejnego poziomu (level). Użytkownik wprowadza lub generuje pary termin–definicja w liczbie odpowiadającej połowie liczby kart (`cardCount`) odziedziczonej z poziomu 1. Po zapisaniu:

- przycisk „Zapisz” tworzy level i przekierowuje do listy Public Boards;
- przycisk „Zapisz i utwórz kolejny level” tworzy level i resetuje formularz, aby dodać następny.

## 2. Routing widoku

`/boards/:rootId/add-level` – tylko dla zalogowanego użytkownika (właściciela).

**Struktura pliku strony:**

```astro
---
import Layout from "@/layouts/Layout.astro";
import AddLevelPage from "@/components/pages/AddLevelPage";
const { id } = Astro.params; // rootId
---

<Layout>
  <AddLevelPage boardId={id} client:load />
</Layout>
```

## 3. Struktura komponentów

```
AddLevelPage (Astro page + withProviders)
 ├── AddLevelForm (React)
 │    ├── PairFormRow (re-use)
 │    └── Przyciski akcji (inline w formularzu)
 └── GeneratePairsByAI (panel boczny)
```

## 4. Szczegóły komponentów

### AddLevelPage

- **Opis:** Kontener układu, pobiera dane planszy przez `useGetBoardByIdQuery`, renderuje formularz i panel AI. Zarządza stanem `remainingSlots`.
- **Główne elementy:** 2-kolumnowy flex (responsywny), `LoaderOverlay` podczas ładowania danych.
- **Interakcje:** Komunikacja między formularzem a panelem AI przez ref (`formRef`).
- **Walidacja:** Sprawdzenie czy plansza została załadowana; wyświetla `LoaderOverlay` podczas ładowania.
- **Typy:** `AddLevelPageProps` z `boardId: string`.
- **Propsy:** `{ boardId: string }` - przekazywany z Astro params.
- **Hooki:** `useGetBoardByIdQuery(boardId)` - pobiera dane planszy (title, cardCount).
- **Stan:** `remainingSlots` - liczba pozostałych slotów na pary (aktualizowany przez useEffect).

### AddLevelForm

- **Opis:** Formularz react-hook-form do wprowadzania par i wysyłki do API. Używa `forwardRef` i `useImperativeHandle` do exposowania metody `addPairs` dla komponentu rodzica.
- **Główne elementy:** lista `PairFormRow`, przycisk „Dodaj parę" (z licznikiem), dwa przyciski submit (inline).
- **Interakcje:** dodanie/usuniecie wiersza, submit (2 tryby: "save" i "saveAndContinue").
- **Walidacja (Zod Schema):**
  - liczba par >= 1 (nonempty);
  - liczba par <= cardCount/2 (sprawdzane przed submit);
  - niepuste pola `term`, `definition` (trim().min(1));
  - ❌ brak walidacji unikalności `term`.
- **Typy:** `AddLevelFormValues` zdefiniowany przez `AddLevelSchema` (Zod).
- **Propsy:** `{ rootId: string; cardCount: 16 | 24 }`.
- **Ref Handle:** `AddLevelFormHandle` z metodą `addPairs(pairs)`.
- **Stan:** `saveMode` - określa tryb zapisu ("save" | "saveAndContinue").

### PairFormRow

- **Opis:** Wiersz pary z usuwaniem. Komponent re-używany z CreateBoardForm bez zmian.
- **Główne elementy:** 2 × `<input>` (term, definition), przycisk „×" (destructive).
- **Interakcje:** wpisywanie tekstu, usunięcie wiersza.
- **Walidacja:** wyświetla błędy przekazane przez RHF (errors?.term, errors?.definition).
- **Typy:** `IPairFormRowProps` z `UseFormRegister<CreateBoardFormValues>`.
- **Propsy:** `{ index, register, errors, onRemove }`.
- **Uwaga:** ❌ NIE został rozszerzony o prop `disabled` - blokada dodawania odbywa się na poziomie przycisku "Dodaj parę" w AddLevelForm.

### Przyciski akcji (inline w AddLevelForm)

- **Opis:** Dwa przyciski submitu zaimplementowane bezpośrednio w `AddLevelForm` (NIE jako osobny komponent).
- **Główne elementy:**
  - `<Button type="submit">Zapisz</Button>` (primary, bg-[var(--color-primary)])
  - `<Button type="submit" variant="outline">Zapisz i utwórz kolejny level</Button>`
- **Interakcje:** `onClick` każdego przycisku ustawia `saveMode` state przed submitem.
- **Walidacja:** przyciski są `disabled` gdy `isSubmitting === true`.
- **Testowanie:** data-testid: "save-level-button" i "save-and-continue-level-button".

### GeneratePairsByAI

- **Opis:** Panel generowania AI z limitem znaków (≤ 5000) i blokowaniem gdy brak miejsc. Panel fixed na mobile (bottom), sticky na desktop (right side).
- **Główne elementy:** `Textarea` (z onKeyDown dla Enter), `Button` "Generuj", `AcceptPairsModal`.
- **Interakcje:** generate (przez przycisk lub Enter), accept (dodaje wybrane pary), cancel.
- **Walidacja:** przycisk disabled gdy:
  - `isLoading === true`
  - `inputText.trim()` jest pusty
  - `remainingSlots !== undefined && remainingSlots <= 0`
- **Typy:** używa `{ term: string; definition: string }[]` dla par.
- **Propsy:** `{ formRef?: RefObject<CreateBoardFormHandle | null>; remainingSlots?: number; onAdd?: (pairs) => void }`.
- **Backward compatibility:** wspiera zarówno `formRef` (stary sposób) jak i `onAdd` callback (nowy sposób).

## 5. Typy

```ts
// AddLevelForm.tsx
export const AddLevelSchema = z.object({
  pairs: z
    .array(
      z.object({
        term: z.string().trim().min(1, "Wymagane"),
        definition: z.string().trim().min(1, "Wymagane"),
      })
    )
    .nonempty("Dodaj co najmniej jedną parę"),
});

export type AddLevelFormValues = z.infer<typeof AddLevelSchema>;

export interface AddLevelFormHandle {
  addPairs: (pairs: { term: string; definition: string }[]) => void;
}

interface AddLevelFormProps {
  rootId: string;
  cardCount: 16 | 24;
}

// AddLevelPage.tsx
interface AddLevelPageProps extends Record<string, unknown> {
  boardId: string;
}

// Stan saveMode w AddLevelForm
type SaveMode = "save" | "saveAndContinue";
```

## 6. Zarządzanie stanem

### AddLevelPage

- **useState:** `remainingSlots` - obliczany na podstawie `cardCount / 2 - getPairs()`.
- **useEffect:** aktualizuje `remainingSlots` gdy zmieni się `board`.
- **useRef:** `formRef` - referencja do `AddLevelFormHandle` do komunikacji z formularzem.
- **RTK Query:** `useGetBoardByIdQuery(boardId)` - pobiera dane planszy.

### AddLevelForm

- **react-hook-form:** zarządza stanem pól formularza (`useForm`, `useFieldArray`).
- **useState:** `saveMode` - przechowuje wybrany tryb zapisu ("save" | "saveAndContinue").
- **useImperativeHandle:** exposuje metodę `addPairs` dla komponentu rodzica.
- **RTK Query:** `useAddLevelMutation()` - wysyła POST do API.
- **Redux:**
  - `dispatch(setLoading(true/false))` - zarządza globalnym stanem ładowania.
  - `useAppDispatch()`, `useToast()` - hooki Redux.

### GeneratePairsByAI

- **useState:** `inputText` (textarea content), `pairs` (wygenerowane pary z API).
- **RTK Query:** `useGeneratePairsMutation()` - generuje pary przez AI.

## 7. Integracja API

- **Query hook:**

```ts
const { data: board, isFetching } = useGetBoardByIdQuery(boardId);
```

- **Mutation hook:**

```ts
const [addLevel] = useAddLevelMutation();
```

- **API Endpoint:** POST `/api/boards/level`
- **Request body:** `{ boardId: string, pairs: PairCreateCmd[] }`
- **Response:** `BoardDetailDTO`
- **Sukces:**
  - tryb `save` → `window.location.href = Routes.Boards` (redirect do listy plansz);
  - tryb `saveAndContinue` → `reset({ pairs: [] })` + `showToast({ type: "success", title: "Sukces", message: "Poziom zapisany" })`.
- **Błędy:** Generic error handling - wyświetla toast z `apiError` lub "Nie udało się zapisać".

## 8. Interakcje użytkownika

| Akcja                         | Wynik                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------- |
| Dodaj parę                    | Nowy `PairFormRow` o ile limit nieprzekroczony                                |
| Usuń parę                     | Wiersz znika                                                                  |
| Generuj AI                    | Pary dodane do modala → wybrane trafiają do formularza (z zachowaniem limitu) |
| Zapisz                        | Utworzenie levela i powrót do listy                                           |
| Zapisz i utwórz kolejny level | Utworzenie levela i reset formularza                                          |

## 9. Warunki i walidacja

1. `pairs.length >= 1` (nonempty) - walidowane przez Zod.
2. `pairs.length <= cardCount/2` - sprawdzane przed wysyłką, wyświetla toast błędu.
3. `term`, `definition` trim().min(1, "Wymagane") - walidowane przez Zod.
4. ❌ Brak walidacji unikalności `term` (nie zaimplementowane).
5. Limit dodawania par - przycisk "Dodaj parę" wyświetlany tylko gdy `remainingSlots > 0`.
6. Limit AI - przycisk "Generuj" disabled gdy `remainingSlots <= 0`.

## 10. Obsługa błędów

- **Implementacja:** Generic error handling przez try-catch.
- **Błąd API:** Wyświetla toast z `apiError` (z response) lub fallback "Nie udało się zapisać".
- **Loading state:** Zarządzany przez `dispatch(setLoading(true/false))` i `LoaderOverlay`.
- **Walidacja formularza:** Błędy Zod wyświetlane przy polach przez RHF.
- **Uwaga:** ❌ Brak szczegółowej obsługi konkretnych kodów błędów (400, 401, 500) - wszystkie traktowane identycznie.

## 11. Status implementacji

✅ **Zrealizowane:**

1. Strona `src/pages/boards/[id]/add-level.astro` - zgodna z planem.
2. Komponent `AddLevelPage.tsx` z integracją `useGetBoardByIdQuery`.
3. Komponent `AddLevelForm.tsx` z walidacją Zod i obsługą dwóch trybów zapisu.
4. Hook `useAddLevelMutation` w `apiSlice` (POST `/api/boards/level`).
5. Zaadaptowany `GeneratePairsByAI` z propsami `remainingSlots` i `onAdd`.
6. Komunikacja między komponentami przez `ref` i `useImperativeHandle`.
7. Przyciski akcji zintegrowane bezpośrednio w `AddLevelForm`.
8. Przekierowania i reset formularza według trybu zapisu.
9. Testy E2E - `AddLevelPage` w page objects.

❌ **Nie zrealizowane / Różnice od planu:**

1. `PairFormRow` NIE został rozszerzony o prop `disabled` - limit obsługiwany na poziomie przycisku "Dodaj parę".
2. `FormActionButtons` NIE istnieje jako osobny komponent - przyciski są inline w formularzu.
3. Brak walidacji unikalności `term`.
4. Brak szczegółowej obsługi konkretnych kodów błędów HTTP (400, 401, 500).
5. Walidacja liczby par: sprawdzane `<= cardCount/2` zamiast `=== cardCount/2` (bardziej liberalne).

✅ **Dodatkowe usprawnienia poza planem:**

1. Licznik pozostałych slotów w przycisku "Dodaj parę" (`+ Dodaj parę (X)`).
2. Obsługa Enter w textarea GeneratePairsByAI.
3. Backward compatibility w GeneratePairsByAI (formRef + onAdd).
4. Responsywny layout z fixed panel na mobile, sticky na desktop.
5. Data-testid attributes dla testów E2E.
