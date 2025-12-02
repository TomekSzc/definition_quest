# Plan implementacji widoku Edycja planszy (Edit Board View)

## 1. Przegląd

Widok „Edycja planszy" umożliwia właścicielowi istniejącej planszy (`board`) modyfikację jej tytułu oraz edycję, dodawanie i usuwanie pojedynczych par termin–definicja (`pairs`). Użytkownik może powrócić do poprzedniego ekranu lub rozpocząć proces dodawania kolejnego poziomu. Widok jest dostępny wyłącznie dla zalogowanego właściciela planszy.

**Uwaga:** Edycja metadanych takich jak widoczność (isPublic), tagi i archiwizacja NIE jest zaimplementowana w tym widoku.

## 2. Routing widoku

```
/boards/:id/edit
```

- **Prerender:** `false` – wymaga danych runtime + autoryzacji.
- Widok otwierany po kliknięciu ikonki „✏️” (edit) na kartach listowania plansz (`MyBoardsPage`, `BoardsPage` itp.). Ikonka renderuje link `<Link href={\`/boards/${id}/edit\`}>`.
- Usługa ładowania danych odbywa się po stronie klienta (React + SWR/`useEffect`) lub przez Astro `onMount`.

## 3. Struktura komponentów

```
EditBoardPage (w src/components/pages/EditBoardPage.tsx)
└── EditBoardForm (w src/components/forms/EditBoardForm.tsx)
    ├── BoardTitleInput (w src/components/forms/parts/BoardTitleInput.tsx)
    ├── PairEditList (w src/components/forms/parts/PairEditList.tsx)
    │   └── PairEditRow (×n) (w src/components/forms/parts/PairEditRow.tsx)
    ├── AddPairsForm (w src/components/forms/parts/AddPairsForm.tsx)
    └── ActionBar (inline - przyciski Powrót i Dodaj level)
```

## 4. Szczegóły komponentów

### 4.1 EditBoardPage

- **Opis:** kontener strony; odpowiada za pobranie danych boarda, renderuje loader / error / formularz.
- **Główne elementy:** `<div>` wrapper z paddingiem, `<LoaderOverlay />` (gdy ładuje), `<EditBoardForm />`.
- **Interakcje:**
  - Używa custom hook `useBoard(boardId)` (wrappuje RTK Query `useGetBoardByIdQuery`) do pobrania danych.
  - Obsługa błędu → wyświetlenie toast error przez Redux dispatch.
- **Walidacja:** brak (walidacja odbywa się w podrzędnych komponentach).
- **Typy:** `BoardViewDTO` (z API), `EditBoardVM` (stan lokalny w podformularzach).
- **Propsy:** `{ boardId: string }` (z paramów routa).
- **Provider:** komponent opakowany w `withProviders` HOC (Redux Provider).

### 4.2 EditBoardForm

- **Opis:** zarządza lokalnym stanem (`EditBoardVM`) oraz orkiestruje zapytania PATCH/POST/DELETE dla tytułu i par przez RTK Query mutations.
- **Główne elementy:** `BoardTitleInput`, `PairEditList`, `AddPairsForm`, przyciski akcji (inline, nie jako osobny komponent).
- **Interakcje:**
  - Przekazuje do dzieci callbacki: `handleTitleSave`, `handlePairSave`, `onDelete`.
  - **Optymistycznie** aktualizuje lokalny stan (`setVm`) po sukcesie mutacji.
  - Wywołuje `onRefresh()` po zapisie tytułu (odświeżenie danych z serwera).
  - Używa `useToast` do wyświetlania powiadomień sukces/błąd.
- **Walidacja:** sprawdzanie limitu długości tytułu / pustych pól odbywa się w podkomponentach.
- **Typy:** `EditBoardVM` (lokalny VM), `PatchBoardCmd`, `PairUpdateCmd`, `PairCreateCmd`.
- **Propsy:** `{ board: BoardViewDTO, onRefresh: () => void }`.
- **Mutations:** `useUpdateBoardMetaMutation`, `useUpdatePairMutation` (RTK Query hooks).
- **Routing:** przyciski nawigacji - `history.back()` i link `<a href={/boards/${id}/add-level}>` (nie disabled, w pełni funkcjonalny).

### 4.3 BoardTitleInput

- **Opis:** wyświetla tytuł w trybie readonly + ikonę edycji; po kliknięciu przechodzi w tryb edycji z inputem + przyciski zatwierdź/annuluj.
- **Główne elementy:** `<h2>` (dla readonly), `<input>` (tryb edycji), ikonki (`EditIcon`, `CheckIcon`, `XIcon` z `@/assets/icons`), `Button` z Shadcn/ui (variant="ghost", size="icon").
- **Interakcje:**
  1. Klik na `EditIcon` → `setIsEditing(true)`.
  2. `handleConfirm` → walidacja (>0 znaków, ≤255 znaków, trimmed) → wywołuje callback `onSave(draft.trim())` → rodzic wywołuje PATCH `/api/boards/:id`.
  3. `handleCancel` → reset draftu do oryginalnej wartości, `setIsEditing(false)`.
- **Walidacja:** pusty string (trim() === 0) lub >255 znaków → blokuje zapis.
- **Typy:** `IBoardTitleInputProps` `{ value: string; onSave: (title: string) => void }`.
- **Stan lokalny:** `isEditing: boolean`, `draft: string`.

### 4.4 PairEditList

- **Opis:** renderuje listę `PairEditRow`, przekazuje callbacki; sprawdza limit par.
- **Główne elementy:** `<div>` z klasą `space-y-4` (nie `<ul>`/`<li>`).
- **Interakcje:** propaguje zdarzenia `onSave` i `onDelete` z wierszy do rodzica.
- **Walidacja:**
  - Sprawdza czy `pairs.length > cardCount / 2` → jeśli tak, wyświetla toast error.
  - Limit odczytywany z propsa `cardCount`.
- **Typy:** `IPairEditListProps` `{ boardId: string; pairs: PairDTO[]; cardCount: number; onSave: (pairId, patch) => void; onDelete: (pairId) => void }`.
- **Toast:** używa `useToast()` hook do wyświetlania błędów limitu.

### 4.5 PairEditRow

- **Opis:** pojedynczy wiersz term/definition; analogiczna logika do `BoardTitleInput` lecz z dwoma polami + funkcjonalność usuwania.
- **Główne elementy:** 
  - Tryb readonly: `<div>` z `<p>` dla term (font-bold) i definition (text-sm), ikonki `EditIcon` i `DeleteIcon`.
  - Tryb edycji: `<input>` dla term + `<textarea>` dla definition, przyciski ✓ (`CheckIcon`) i ✗ (`XIcon`).
- **Interakcje:**
  1. Klik `EditIcon` → `setIsEditing(true)`.
  2. `handleConfirm` → sprawdza czy coś się zmieniło (term lub definition) → jeśli nie, tylko zamyka edycję → jeśli tak, wywołuje `onSave(pair.id, patch)` → rodzic wywołuje PATCH `/api/boards/:boardId/pairs/:pairId`.
  3. Klik cancel (`XIcon`) → `reset()` (przywraca oryginalne wartości).
  4. Klik `DeleteIcon` → wywołuje `deletePair` mutation (RTK Query) → po sukcesie wywołuje `onDelete(pair.id)` i toast sukces.
- **Walidacja:** tworzy patch tylko dla zmienionych pól (trim + porównanie z oryginałem); jeśli patch pusty, nie wywołuje API.
- **Typy:** `IPairEditRow` `{ boardId: string; pair: PairDTO; onSave: (pairId, patch) => void; onDelete: (pairId) => void }`.
- **Mutations:** `useDeletePairMutation()` (RTK Query hook).
- **Toast:** `useToast()` dla komunikatów sukces/błąd przy usuwaniu.

### 4.6 AddPairsForm

- **Opis:** formularz do dodawania nowych par; zarządza listą draft pairs, pozwala dodać wiele par w trybie edycji przed zapisem każdej z osobna.
- **Główne elementy:**
  - Lista draft pairs (lokalny stan) - każdy draft to `<div>` z dwoma inputami (term, definition) + przyciski ✓ ✗.
  - Przycisk "+ Dodaj parę (X)" gdzie X to `remainingSlots` = `cardCount / 2 - existingCount - draftPairs.length`.
- **Interakcje:**
  1. `addDraftRow` → dodaje pusty draft `{ term: "", definition: "" }` do lokalnej listy (jeśli `remainingSlots > 0`).
  2. `saveDraftRow(index)` → walidacja (oba pola niepuste po trim) → POST `/api/boards/:boardId/pairs` → po sukcesie wywołuje `onPairAdded(created)` (rodzic aktualizuje VM) → usuwa draft z lokalnej listy → toast sukces.
  3. `removeDraftRow(index)` → usuwa draft z lokalnej listy (anulacja).
- **Walidacja:** sprawdza czy `term.trim()` i `definition.trim()` są niepuste przed zapisem.
- **Typy:** `AddPairsFormProps` `{ boardId: string; existingCount: number; cardCount: number; onPairAdded: (pair: PairDTO) => void }`.
- **Stan lokalny:** `draftPairs: Array<{ term: string; definition: string }>`.
- **Mutations:** `useAddPairMutation()` (RTK Query hook).
- **Toast:** `useToast()` dla komunikatów sukces/błąd.

### 4.7 ActionBar

- **Opis:** przyciski dolne (zaimplementowane inline w `EditBoardForm`, nie jako osobny komponent).
- **Główne elementy:** Tailwind flex container (`justify-between`, `pt-10`), przycisk "Powrót", przycisk/link "Dodaj level".
- **Interakcje:**
  - Przycisk "Powrót" → `history.back()`.
  - Link "Dodaj level" → `<a href="/boards/:id/add-level">` (w pełni funkcjonalny, nie disabled).

## 5. Typy

- **EditBoardVM** – lokalne odwzorowanie `BoardViewDTO` bez części tylko-do-odczytu:

```ts
interface EditBoardVM {
  id: string;
  title: string;
  pairs: PairDTO[];
  isPublic: boolean;
  tags: string[];
  archived: boolean;
}
```

- **BoardTitleInputProps**, **PairEditRowProps** – jak w pkt 4.
- **API payloady:**
  - `PatchBoardCmd` (import z `src/types.ts`).
  - `PairUpdateCmd` (import).

## 6. Zarządzanie stanem

- **Globalny stan:** Redux store z RTK Query dla mutacji i cache'owania.
- **Lokalny stan w `EditBoardForm`:** `useState<EditBoardVM>` - mapuje `BoardViewDTO` do lokalnego VM; aktualizowany optymistycznie po sukcesie mutacji.
- **Lokalny stan w podkomponentach:** 
  - `BoardTitleInput`: `isEditing`, `draft` (string).
  - `PairEditRow`: `isEditing`, `term`, `definition` (stringi).
  - `AddPairsForm`: `draftPairs` (array draft pair objects).
- **Hook `useBoard`:** custom hook w `src/hooks/useBoard.ts`; wrappuje `useGetBoardByIdQuery` z RTK Query; expose `{ board, isLoading, isError, error, refresh }`.
- **Mutations (RTK Query):**
  - `useUpdateBoardMetaMutation` - PATCH board meta (tytuł).
  - `useUpdatePairMutation` - PATCH pair.
  - `useAddPairMutation` - POST pair.
  - `useDeletePairMutation` - DELETE pair.
- **Cache invalidation:** wszystkie mutacje invalidują tag `{ type: "Boards", id: boardId }` co powoduje refetch danych board.
- **Toasts:** Redux slice `toastSlice` z akcją `showToast` (dispatch przez `useAppDispatch` lub `useToast` hook).

## 7. Integracja API

1. **GET** `/api/boards/:id` – ładowanie danych board przy mount (przez `useGetBoardByIdQuery` w hook `useBoard`).
   - Typ odpowiedzi: `BoardViewDTO`.
   
2. **PATCH** `/api/boards/:id` – aktualizacja meta (obecnie tylko tytuł; wywołane z `BoardTitleInput` przez `handleTitleSave`).
   - Typ żądania: `PatchBoardCmd` (partial: `{ title?: string, isPublic?: boolean, archived?: boolean, tags?: string[] }`).
   - Typ odpowiedzi: `{ message: string }`.
   - Mutation: `useUpdateBoardMetaMutation`.
   
3. **PATCH** `/api/boards/:boardId/pairs/:pairId` – aktualizacja pary (term i/lub definition).
   - Typ żądania: `PairUpdateCmd` (partial: `{ term?: string, definition?: string }`).
   - Typ odpowiedzi: `PairDTO`.
   - Mutation: `useUpdatePairMutation`.
   
4. **POST** `/api/boards/:boardId/pairs` – dodanie nowej pary (wywołane z `AddPairsForm`).
   - Typ żądania: `PairCreateCmd` `{ term: string, definition: string }`.
   - Typ odpowiedzi: `PairDTO` (status 201).
   - Mutation: `useAddPairMutation`.
   
5. **DELETE** `/api/boards/:boardId/pairs/:pairId` – usunięcie pary (wywołane z `PairEditRow`).
   - Brak body.
   - Typ odpowiedzi: `{ id: string, boardId: string, message: string }`.
   - Mutation: `useDeletePairMutation`.

## 8. Interakcje użytkownika

| Akcja                       | Rezultat                                                                      |
| --------------------------- | ----------------------------------------------------------------------------- |
| Klik „edit" przy tytule     | Pokazuje input + przyciski ✓✗                                                 |
| Klik ✓ przy tytule          | Walidacja → PATCH `/api/boards/:id` → toast „Zapisano" → readonly            |
| Klik ✗ przy tytule          | Anulacja zmian, powrót do readonly                                            |
| Klik „edit" przy parze      | Pokazuje input + textarea + ✓✗                                                |
| Klik ✓ przy parze           | Walidacja → PATCH `/api/boards/:boardId/pairs/:pairId` → toast + aktualizacja |
| Klik ✗ przy parze           | Anulacja zmian, powrót do readonly                                            |
| Klik „delete" przy parze    | DELETE `/api/boards/:boardId/pairs/:pairId` → toast + usunięcie z listy       |
| Klik „+ Dodaj parę (X)"     | Dodaje pusty draft pair do listy (tryb edycji)                                |
| Klik ✓ przy draft pair      | Walidacja → POST `/api/boards/:boardId/pairs` → toast + dodanie do listy      |
| Klik ✗ przy draft pair      | Anulacja, usunięcie draftu                                                    |
| Klik „Powrót"               | `history.back()`                                                              |
| Klik „Dodaj level"          | Przekierowanie do `/boards/:id/add-level`                                     |

## 9. Warunki i walidacja

- **Tytuł:** 1–255 znaków (po trim); walidacja w `BoardTitleInput` - blokuje zapis jeśli pusty lub >255.
- **Pair (edycja):** 
  - Term i definition - minimum 1 znak po trim.
  - PATCH wysyłany tylko dla zmienionych pól.
  - Jeśli nic się nie zmieniło, zamyka tryb edycji bez API call.
- **Pair (dodawanie):**
  - Oba pola (term, definition) **wymagane** - muszą być niepuste po trim.
  - Walidacja w `AddPairsForm` przed POST.
- **Liczba par:** 
  - Maksymalnie `cardCount / 2` par.
  - `PairEditList` sprawdza limit i wyświetla toast error jeśli przekroczony.
  - `AddPairsForm` oblicza `remainingSlots` i blokuje dodawanie nowych draft pairs gdy limit osiągnięty (przycisk "+ Dodaj parę" ukryty gdy `remainingSlots <= 0`).

## 10. Obsługa błędów

- **400 Validation:** API zwraca `{ error: string }` → wyświetlany w toast error (nie pod inputem, tylko toast).
- **401 Unauthorized:** 
  - W `EditBoardPage`: brak user → wyświetla toast error.
  - Middleware Astro może przekierować do `/login` przed dotarciem do strony.
- **404 Board/Pairs not found:** 
  - W `useBoard` hook: `isError` = true → toast error w `EditBoardPage`.
  - Nie ma automatycznego redirectu do `/boards` - użytkownik musi ręcznie wrócić.
- **409 Conflict (duplicate, archived):** toast error z komunikatem z API (`error.data?.error`).
- **500 Server error:** toast error z generic message „Nie udało się zapisać/usunąć".
- **Toast system:** Redux `toastSlice` + `useToast` hook; wszystkie błędy API wyświetlane jako toasty (nie inline errors).

## 11. Kroki implementacji (zrealizowane)

1. ✅ Utworzono Astro route `/src/pages/boards/[id]/edit.astro` z renderowaniem `EditBoardPage` client-side (`client:load`).
2. ✅ Utworzono komponent `EditBoardPage` w `/src/components/pages/EditBoardPage.tsx`.
3. ✅ Zaimplementowano hook `useBoard(boardId)` w `/src/hooks/useBoard.ts` (wrapper dla RTK Query).
4. ✅ Utworzono komponent `EditBoardForm` w `/src/components/forms/EditBoardForm.tsx`.
5. ✅ Utworzono podkomponenty w `/src/components/forms/parts/`:
   - `BoardTitleInput.tsx`
   - `PairEditList.tsx`
   - `PairEditRow.tsx`
   - `AddPairsForm.tsx` (dodatkowy, nie w pierwotnym planie)
6. ✅ Dodano ikonki z `/src/assets/icons` (`EditIcon`, `DeleteIcon`, `CheckIcon`, `XIcon`).
7. ✅ Zaimplementowano przyciski z Shadcn/ui `Button` (variant="ghost", size="icon").
8. ✅ Dodano RTK Query mutations w `src/store/api/apiSlice.ts`:
   - `useUpdateBoardMetaMutation`
   - `useUpdatePairMutation`
   - `useAddPairMutation`
   - `useDeletePairMutation`
9. ✅ Zaimplementowano API endpoints:
   - GET `/api/boards/:id`
   - PATCH `/api/boards/:id`
   - PATCH `/api/boards/:boardId/pairs/:pairId`
   - POST `/api/boards/:boardId/pairs`
   - DELETE `/api/boards/:boardId/pairs/:pairId`
10. ✅ Dodano obsługę toastów przez Redux `toastSlice` + `useToast` hook.
11. ✅ Zaimplementowano styling z Tailwind 4.
12. ✅ Dodano data-testid attributy dla testów E2E.
13. ✅ Zaimplementowano Page Object dla testów E2E (`EditBoardPage` w `tests/e2e/helpers/page-objects.ts`).

## 12. Funkcjonalności NIE zaimplementowane (względem pierwotnego planu)

- ❌ Edycja tagów (`TagSelector`) - nie zaimplementowana.
- ❌ Edycja widoczności (`isPublic` toggle) - nie zaimplementowana.
- ❌ Edycja archiwizacji (`archived` checkbox) - nie zaimplementowana.
- ❌ `ActionBar` jako osobny komponent - zaimplementowane inline.
- ❌ Redirect do `/boards` przy 404 - tylko toast error, bez redirectu.

## 13. Dodatkowe funkcjonalności (poza planem)

- ✅ `AddPairsForm` - pełny formularz do dodawania wielu par z draft state.
- ✅ Funkcjonalność usuwania par (DELETE endpoint + UI).
- ✅ Cache invalidation i refetch przez RTK Query tags.
- ✅ Przycisk "Dodaj level" w pełni funkcjonalny (nie disabled placeholder).
