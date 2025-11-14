# Plan implementacji widoku Edycja planszy (Edit Board View)

## 1. Przegląd

Widok „Edycja planszy” umożliwia właścicielowi istniejącej planszy (`board`) modyfikację jej metadanych (tytuł, widoczność, tagi, archiwizacja) oraz edycję pojedynczych par termin–definicja (`pairs`). Użytkownik może powrócić do poprzedniego ekranu lub rozpocząć proces dodawania kolejnego poziomu. Widok jest dostępny wyłącznie dla zalogowanego właściciela planszy.

## 2. Routing widoku

```
/boards/:id/edit
```

- **Prerender:** `false` – wymaga danych runtime + autoryzacji.
- Widok otwierany po kliknięciu ikonki „✏️” (edit) na kartach listowania plansz (`MyBoardsPage`, `BoardsPage` itp.). Ikonka renderuje link `<Link href={\`/boards/${id}/edit\`}>`.
- Usługa ładowania danych odbywa się po stronie klienta (React + SWR/`useEffect`) lub przez Astro `onMount`.

## 3. Struktura komponentów

```
EditBoardPage
├── EditBoardForm
│   ├── BoardTitleInput
│   ├── PairEditList
│   │   └── PairEditRow (×n)
├── Divider
└── ActionBar
    ├── BackButton
    └── AddLevelButton
```

## 4. Szczegóły komponentów

### 4.1 EditBoardPage

- **Opis:** kontener strony; odpowiada za pobranie danych boarda, renderuje loader / error / formularz.
- **Główne elementy:** `<main>`, `<h1>`, `<EditBoardForm />`.
- **Interakcje:**
  - `useEffect` on mount – fetch danych GET `/api/boards/:id`.
  - Obsługa błędu 401/404 → redirect lub komunikat.
- **Walidacja:** brak (walidacja odbywa się w podrzędnych komponentach).
- **Typy:** `BoardViewDTO`, `EditBoardVM` (stan lokalny).
- **Propsy:** `{ boardId: string }` (z paramów routa).

### 4.2 EditBoardForm

- **Opis:** zarządza lokalnym stanem (pessymistyczny updates) oraz orkiestruje zapytania PATCH dla meta i par.
- **Główne elementy:** `BoardTitleInput`, `PairEditList`, `TagSelector`, przyciski akcji.
- **Interakcje:**
  - Przekazuje do dzieci callbacki `onUpdateTitle`, `onUpdatePair`, `onDeletePair`.
  - Optymistycznie aktualizuje lokalny stan po sukcesie PATCH.
- **Walidacja:** sprawdzanie limitu długości tytułu / pustych pól.
- **Typy:** `PatchBoardCmd`, lokalny `FormState`.
- **Propsy:** `{ board: BoardViewDTO, onChange?: (draft) => void }`.

### 4.3 BoardTitleInput

- **Opis:** wyświetla tytuł w trybie readonly + ikonę edycji; po kliknięciu przechodzi w tryb edycji z inputem + przyciski zatwierdź/annuluj.
- **Główne elementy:** `<span>`, `<input>`, ikonki (Heroicons), zielony `Button` ✓, czerwony `Button` ✗.
- **Interakcje:**
  1. `onEditClick` → `isEditing = true`.
  2. `onConfirm` → walidacja (1–255 znaków) → PATCH `/api/boards/:id` `{ title }`.
  3. `onCancel` → reset.
- **Walidacja:** pusty string / >255 znaków.
- **Typy:** `BoardTitleInputProps` `{ value: string; onSave(title) }`.
- **Propsy:** jw.

### 4.4 PairEditList

- **Opis:** renderuje listę `PairEditRow`, przekazuje callbacki.
- **Główne elementy:** `<ul>` → `<li>`.
- **Interakcje:** propaguje zdarzenia z wierszy.
- **Walidacja:**
  - Nie można przekroczyć limitu **cardCount / 2** wierszy; przy próbie dodania nowej pary (gdy nadchodzi w przyszłości) lub przy próbie wczytania nieprawidłowych danych komponent pokazuje komunikat błędu.
  - Limit odczytywany z `board.cardCount`.
- **Typy:** `PairDTO[]`.
- **Propsy:** `{ pairs, onUpdate(pairId, patch), onDelete(pairId) }`.

### 4.5 PairEditRow

- **Opis:** pojedynczy wiersz term/definition; analogiczna logika do `BoardTitleInput` lecz z dwoma polami.
- **Główne elementy:** `<p>` lub `<div>` + ikonka edit → `<input>` x2 + przyciski ✓ ✗.
- **Interakcje:**
  1. `onEdit` → `isEditing`.
  2. `onConfirm` → walidacja (≥1 znak każde gdy obecne) → PATCH `/api/boards/:boardId/pairs/:pairId`.
  3. `onCancel`.
- **Walidacja:** oba pola opcjonalne, ale przynajmniej jedno musi się zmienić; ≥1 znak.
- **Typy:** `PairEditRowProps` `{ pair: PairDTO, onSave(cmd), onDelete() }`.

### 4.6 ActionBar

- **Opis:** przyciski dolne.
- **Główne elementy:** Tailwind flex container, `BackButton`, `AddLevelButton` (disabled placeholder).
- **Interakcje:**
  - `BackButton` → `history.back()`.
  - `AddLevelButton` → `navigate('/boards/:id/levels/new')` (TBD).

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

- Lokalny stan formularza w `EditBoardForm` (`useState<EditBoardVM>`).
- Flag `isSaving` per wiersz do kontroli spinnera.
- Optymistyczna aktualizacja listy pairs po sukcesie PATCH.
- Hook `useBoard` (custom): pobiera board + expose `refresh()`.

## 7. Integracja API

1. **GET** `/api/boards/:id` – ładujemy dane przy mount.
2. **PATCH** `/api/boards/:id` – aktualizacja meta (wywoływana z `BoardTitleInput`, `TagSelector`, checkboxy itp.).
   - Typ żądania: `PatchBoardCmd` partial.
   - Typ odpowiedzi: `{ message: string }` lub pełny `BoardDetailDTO` (zależnie od implementacji backend) – używamy tylko do odświeżenia stanu.
3. **PATCH** `/api/boards/:boardId/pairs/:pairId` – aktualizacja pary.
   - Typ żądania: `PairUpdateCmd`.
   - Typ odpowiedzi: `PairDTO`.

## 8. Interakcje użytkownika

| Akcja                   | Rezultat                                           |
| ----------------------- | -------------------------------------------------- |
| Klik „edit” przy tytule | Pokazuje input + przyciski ✓✗                      |
| Klik ✓ przy tytule      | Walidacja → PATCH → snackbar „Zapisano” → readonly |
| Klik ✗ przy tytule      | Anulacja zmian                                     |
| Klik „edit” przy parze  | Dwa inputy + ✓✗                                    |
| Klik ✓ przy parze       | Walidacja → PATCH → aktualizacja listy             |
| Klik ✗ przy parze       | Anulacja                                           |
| Klik „Powrót”           | `history.back()`                                   |
| Klik „Dodaj level”      | Przekierowanie TBD                                 |

## 9. Warunki i walidacja

- Tytuł: 1–255 znaków.
- Term / definition: ≥1 znak; co najmniej jedno z pól w PATCH.
- Liczba par **musi być równa** `cardCount / 2`; UI blokuje dodanie powyżej limitu i sygnalizuje brakujące pary (badge + komunikat) gdy jest ich mniej.

## 10. Obsługa błędów

- 400 Validation → wyświetl listę błędnych pól pod inputem.
- 401 Unauthorized → redirect do `/login`.
- 404 Board/Pairs not found → toast + redirect `/boards`.
- 409 Board archived/duplicate title → toast error.
- 500 → global error handler snackbar.

## 11. Kroki implementacji

1. Utworzyć route `/src/components/pages/EditBoardPage.tsx` + dodać do routing.
2. Zaimplementować hook `useBoard(boardId)`.
3. Stworzyć komponenty: `EditBoardForm`, `BoardTitleInput`, `PairEditList`, `PairEditRow`, `ActionBar` w `src/components/forms`.
4. Dodać przyciski z ikonami (Shadcn/ui `Button`, `Icon` helpers).
5. Obsługa walidacji (Zod) w komponentach edycji.
6. Integracja z API: fetch + patchy (fetch/SWR).
7. UI - implementacja stylów Tailwind 4.
8. Testy ręczne: scenariusze happy path + błędy Validation/401/404/409.
9. Aktualizacja dokumentacji README + changelog.
