# Plan implementacji widoku Dodaj poziom (Add Level View)

## 1. Przegląd
Widok umożliwia właścicielowi istniejącej planszy (board) dodanie kolejnego poziomu (level). Użytkownik wprowadza lub generuje pary termin–definicja w liczbie odpowiadającej połowie liczby kart (`cardCount`) odziedziczonej z poziomu 1. Po zapisaniu:
* przycisk „Zapisz” tworzy level i przekierowuje do listy Public Boards;
* przycisk „Zapisz i utwórz kolejny level” tworzy level i resetuje formularz, aby dodać następny.

## 2. Routing widoku
`/boards/:rootId/add-level` – tylko dla zalogowanego użytkownika (właściciela).

**Struktura pliku strony:**
```astro
---
import React from "react";
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
 │    ├── PairFormRow (re-use, +prop maxPairs)
 │    └── FormActionButtons
```

## 4. Szczegóły komponentów
### AddLevelPage
- **Opis:** Kontener układu, pobiera `rootId` z URL, renderuje formularz i panel AI.
- **Główne elementy:** 2-kolumnowy flex, `LoaderOverlay` na poziomie strony.
- **Interakcje:** Brak bezpośrednich.
- **Walidacja:** Sprawdzenie obecności `rootId`; w przeciwnym razie redirect 404.
- **Typy:** `rootId: string` (z params).
- **Propsy:** Brak (dane z hooków/Kontekstu).

### AddLevelForm
- **Opis:** Formularz react-hook-form do wprowadzania par i wysyłki do API.
- **Główne elementy:** lista `PairFormRow`, przycisk „Dodaj parę”, `FormActionButtons`.
- **Interakcje:** dodanie/usuniecie wiersza, submit (2 tryby).
- **Walidacja:**
  - liczba par `=== cardCount/2` przed wysyłką;
  - niepuste pola `term`, `definition`;
  - unikalność `term` (client-side quick check).
- **Typy:** `AddLevelFormValues` → `{ pairs: PairCreateCmd[] }`.
- **Propsy:** `{ rootId: string; cardCount: 16 | 24 }`.

### PairFormRow (rozszerzony)
- **Opis:** Wiersz pary z usuwaniem.
- **Główne elementy:** 2 × `<input>`, przycisk „×”.
- **Interakcje:** wpisywanie tekstu, usunięcie.
- **Walidacja:** przekazywane przez RHF; dodatkowy prop `maxPairsReached` blokuje dodanie nowego.
- **Typy:** bez zmian.
- **Propsy (nowe):** `disabled?: boolean` (jeśli osiągnięto limit).

### FormActionButtons
- **Opis:** Dwa przyciski submitu.
- **Główne elementy:** `<Button variant="default">Zapisz</Button>` i `<Button variant="outline">Zapisz i utwórz kolejny level</Button>`.
- **Interakcje:** `onClick` ustawia tryb submitu w state.
- **Walidacja:** brak (deleguje do formularza).
- **Typy:** `{ mode: "save" | "saveAndContinue" }`.
- **Propsy:** `{ isSubmitting: boolean }`.

### GeneratePairsByAI (zmiany)
- **Opis:** Panel generowania AI z limitem znaków i widocznym licznikiem pozostałych wierszy.
- **Główne elementy:** `Textarea`, `Button`, `AcceptPairsModal`.
- **Interakcje:** generate, accept, cancel.
- **Walidacja:** blokada gdy `remainingSlots === 0`.
- **Typy:** Re-use `GeneratedPair`.
- **Propsy (nowe):** `{ remainingSlots: number; onAdd(pairs) }`.

## 5. Typy
```ts
export interface AddLevelFormValues {
  pairs: PairCreateCmd[]; // długość = cardCount/2
}

export interface SaveModeState {
  mode: "save" | "saveAndContinue";
}
```

## 6. Zarządzanie stanem
- **react-hook-form** dla pól formularza.
- **useState** w `AddLevelForm` dla `saveMode` i `isSubmitting`.
- **RTK Query**: `useAddLevelMutation` (POST /boards/level).
- **Redux uiSlice.loading** obsługiwane przez `LoaderOverlay`.

## 7. Integracja API
- **Mutation hook:**
```ts
const [addLevel, { isLoading }] = useAddLevelMutation();
```
- **Request body:** `{ boardId: rootId, pairs }` zgodnie z `CreateNextLevelCmd`.
- **Sukces 201:**
  - tryb `save` → `navigate('/public-boards')`;
  - tryb `saveAndContinue` → `reset(form)` + `showToast("Level zapisany")`.
- **Błędy mapowane z HTTP -> toast + fieldErrors (ValidationError).

## 8. Interakcje użytkownika
| Akcja | Wynik |
|-------|-------|
| Dodaj parę | Nowy `PairFormRow` o ile limit nieprzekroczony |
| Usuń parę | Wiersz znika |
| Generuj AI | Pary dodane do modala → wybrane trafiają do formularza (z zachowaniem limitu) |
| Zapisz | Utworzenie levela i powrót do listy |
| Zapisz i utwórz kolejny level | Utworzenie levela i reset formularza |

## 9. Warunki i walidacja
1. `pairs.length === cardCount/2` – blokuje submit.
2. `term`, `definition` trim().length > 0.
3. Unikalność `term` lokalnie.
4. Limit AI – `remainingSlots`.

## 10. Obsługa błędów
- **400 VALIDATION/INVALID_INPUT** → pokaż listę błędów przy polach + toast.
- **400 BOARD_ARCHIVED / 401 NOT_OWNER** → redirect z toastem „Brak dostępu”.
- **500** → toast „Wewnętrzny błąd serwera”.

## 11. Kroki implementacji
1. Dodaj stronę `src/pages/boards/[id]/add-level.astro` jak w przykładzie powyżej (analogicznie do `edit.astro`).
2. Utwórz komponent `AddLevelForm.tsx` na podstawie `CreateBoardForm` (kopiuj z refaktoryzacją).
3. Rozszerz `PairFormRow` o prop `disabled`.
4. Dodaj hook `useAddLevelMutation` w `apiSlice` (endpoint POST `/api/boards/level`).
5. Zaadaptuj `GeneratePairsByAI` – przyjmij `remainingSlots` i blokuj gdy 0.
6. Dodaj walidacje RHF + Zod (opcjonalnie) w `AddLevelForm`.
7. Dodaj `FormActionButtons` z obsługą dwóch trybów.
8. Implementuj przekierowania i reset formularza zależnie od trybu.
9. Zaktualizuj testy jednostkowe (jeśli istnieją) + storybook.
10. Uzupełnij dokumentację i OpenAPI (opcjonalnie w osobnym MR).
