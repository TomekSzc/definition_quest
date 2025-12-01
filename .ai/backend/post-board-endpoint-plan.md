# API Endpoint Implementation Plan: POST /boards – Create Board (manual)

## 1. Przegląd punktu końcowego

Tworzy nową tablicę (board) wraz z osadzonymi parami termin–definicja przekazanymi w treści żądania. Zwraca pełne szczegóły utworzonej tablicy, w tym wygenerowane identyfikatory oraz kopię wprowadzonych par. Operacja wymaga uwierzytelnienia i zalicza się do podstawowego CRUD-a na tablicach.

## 2. Szczegóły żądania

- **Metoda HTTP:** `POST`
- **URL:** `/api/boards`
- **Nagłówki obowiązkowe:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <jwt>` (zapewniane przez middleware)
- **Body (JSON):** zgodne z `CreateBoardCmd`

```jsonc
{
  "title": "Capital Cities", // ≤ 255 znaków
  "cardCount": 16, // 16 lub 24 – liczba kart = 2×pairs.length
  "pairs": [
    // długość = cardCount / 2
    { "term": "France", "definition": "Paris" },
  ],
  "isPublic": false, // default: false
  "tags": ["geography", "europe"], // opcjonalnie: ≤ 10 tagów, każdy ≤ 20 znaków
}
```

### Parametry

| Pole        | Typ               | Wymagane | Walidacja / Reguły                                                              |
| ----------- | ----------------- | -------- | ------------------------------------------------------------------------------- |
| `title`     | `string`          | ✓        | `trim(); min 1; max 255`                                                        |
| `cardCount` | `16 \| 24`        | ✓        | size of one level (cards); **pairs.length may exceed** – will be split          |
| `pairs`     | `PairCreateCmd[]` | ✓        | **1–100 items**; unikatowe `term`; każdy `definition` i `term` `min 1; max 255` |
| `isPublic`  | `boolean`         | ✓        | default `false`                                                                 |
| `tags`      | `string[]`        | –        | max 10; każdy `min 1; max 20`; unikatowe                                        |

## 3. Wykorzystywane typy

**Walidacja (Zod):**
- `CreateBoardSchema` – schemat walidacji Zod (`src/lib/validation/boards.ts`, linie 45-96)
- `CreateBoardInput` – typ wygenerowany z `CreateBoardSchema` (linia 97)

**Modele danych (TypeScript):**
- `CreateBoardCmd` – model komend wejściowych (`src/types.ts`, linie 92-98)
- `PairCreateCmd` – typ pary bez ID (`src/types.ts`, linia 89)
- `PairDTO` – pełny DTO pary z ID (`src/types.ts`, linie 61-65)

**Uwaga:** W rzeczywistej implementacji endpoint zwraca prosty `{ message: string }` zamiast `BoardDetailDTO[]`, ponieważ frontend przekierowuje użytkownika po utworzeniu i nie potrzebuje pełnych danych.

## 4. Szczegóły odpowiedzi

| Kod | Odpowiedź             | Opis                                                        |
| --- | --------------------- | ----------------------------------------------------------- |
| 201 | `{ message: string }` | Utworzono **≥1** tablic (level-based). Np. "Board created with 2 level/s" |
| 400 | `{ error, details? }` | Błąd walidacji danych wejściowych.                          |
| 401 | `{ error }`           | Brak uwierzytelnienia.                                      |
| 409 | `{ error }`           | Konflikt unikalności (duplikat tytułu). Postgres kod: 23505 |
| 429 | `{ error }`           | Przekroczony limit operacji (przyszłość).                   |
| 500 | `{ error }`           | Nieoczekiwany błąd serwera.                                 |

**Uwaga:** Rzeczywista implementacja zwraca prosty komunikat sukcesu zamiast pełnych obiektów `BoardDetailDTO[]`. Jest to optymalizacja, ponieważ frontend po utworzeniu tablicy przekierowuje użytkownika, więc pełne dane nie są potrzebne.

## 5. Przepływ danych

1. `middleware/index.ts` uwierzytelnia request i dodaje `locals.user`, `locals.supabase`.
2. **Router:** `src/pages/api/boards/index.ts` odbiera `POST`.
3. Parsowanie JSON + walidacja `CreateBoardSchema` (linie 79-88).
4. Wywołanie `createBoard` w serwisie `board.service.ts`:
   1. **Podziel `pairs` na segmenty** po `cardCount/2` (np. 8 lub 12 par) używając funkcji `chunkArray`.
   2. **Dla każdego segmentu** (index → `level`):
      - INSERT do `boards` (`level = idx + 1`) z `uuid()` jako ID.
      - Bulk INSERT odpowiadających par poprzez `insertPairsForBoard()`.
   3. Zwróć komunikat sukcesu: `"Board created with ${segments.length} level/s"`.
5. Router zwraca `{ message }` z kodem 201.
6. Ewentualne błędy → mapowanie na kody HTTP poprzez `utils/api-response`.

**Uwaga o transakcjach:** Supabase JS client nie udostępnia jeszcze jawnych helperów transakcyjnych. Implementacja MVP używa sekwencyjnych insertów i polega na RLS oraz unique constraints dla zachowania integralności. W przypadku błędu podczas wstawiania par, RLS zapewnia, że tylko właściciel może zobaczyć częściowo utworzone tablice.

## 6. Względy bezpieczeństwa

- **RLS:** obowiązuje – właściciel (`owner_id`) = `auth.uid()`.
- **Autoryzacja:** sprawdzana w middleware; anonimowi otrzymają 401.
- **Walidacja** po stronie aplikacji + constrainty DB:
  - CHECK `card_count`, `tags`, UNIQUE `(owner_id, title, level)`.
- **SQL injection** niewystępujące – Supabase klient parametryzuje.
- **Brak XSS** – dane przechowywane bez wykonania w kliencie.

## 7. Obsługa błędów

| Sytuacja                               | Błąd/Typ            | Kod | Implementacja                                |
| -------------------------------------- | ------------------- | --- | -------------------------------------------- |
| Parse JSON fail                        | `HttpError`         | 400 | Catch w `request.json()` (linia 79)         |
| Zod validation fail / >100 pairs       | `ValidationError`   | 400 | `CreateBoardSchema.safeParse()` (linia 84)  |
| `locals.user` brak                     | `HttpError`         | 401 | Sprawdzenie w linii 73-76                    |
| Duplikat (unique owner_id+title+level) | Postgres code 23505 | 409 | Sprawdzenie `error.code === "23505"` (107)   |
| Błąd serwisu (np. INSERT_BOARD_FAILED) | Error message       | 500 | Mapowanie przez `getErrorMapping()` (102)    |
| RLS odrzuca (teoretycznie)             | Supabase error      | 500 | Propagowany jako ogólny błąd                 |
| Inne niespodziewane                    | Error               | 500 | Fallback w linii 115                         |

**Szczegóły:**
- `ValidationError` jest łapany jako instancja klasy (linia 97) i zwraca 400 z details
- `HttpError` jest łapany jako instancja klasy (linia 97) i używa własnego statusu
- Błędy Postgres są wykrywane po kodzie (`23505` = unique violation)

## 8. Rozważania dotyczące wydajności

- **Batch insert** par poprzez `insertPairsForBoard()` – jedna operacja `.insert()` z tablicą par.
- Wielokrotny INSERT tablic wykonywany sekwencyjnie (jeden na level).
- Ograniczenia wejścia (`≤100` par) minimalizują obciążenie, ale typowo jest to 8-12 par na level.
- **Brak jawnych transakcji** – Supabase JS client nie oferuje jeszcze API transakcyjnego. Integralność zapewniana przez:
  - RLS – tylko właściciel widzi swoje tablice
  - Unique constraints – `(owner_id, title, level)` zapobiega duplikatom
  - Sequential inserts – w przypadku błędu część poziomów może być utworzona (akceptowalne dla MVP)

## 9. Status implementacji ✅

Endpoint został w pełni zaimplementowany. Poniżej rzeczywiste lokalizacje kodu:

1. **Typy** ✅ – `CreateBoardSchema` w `src/lib/validation/boards.ts` (linie 45-96)
   - Walidacja: title (1-255), cardCount (16|24), pairs (1-100), isPublic, tags
   - Refinement: unikalne termy (case-insensitive)

2. **Serwis** ✅ – `createBoard()` w `src/lib/services/board.service.ts` (linie 90-132)
   - Helper: `chunkArray()` do dzielenia par na segmenty (linie 25-31)
   - Helper: `insertPairsForBoard()` do batch insert par (linie 59-76)

3. **API Route** ✅ – `src/pages/api/boards/index.ts` POST handler (linie 71-117)
   - Uwierzytelnienie (linia 73-76)
   - Parsowanie i walidacja JSON (79-88)
   - Wywołanie serwisu (93)
   - Zwrot `{ message }` z kodem 201 (95)

4. **Mapowanie błędów** ✅ – `DUPLICATE_BOARD` w `utils/api-response.ts` (linie 44-50)
   - Obsługa Postgres code 23505 w routerze (linia 107-112)

5. **Testy** ⚠️ – Brak dedykowanych testów automatycznych (do zrobienia)

6. **Dokumentacja** ✅ – Ten plik stanowi dokumentację implementacji

## 10. Przykłady użycia

### Sukces – pojedynczy poziom (8 par)

**Request:**
```http
POST /api/boards
Content-Type: application/json
Authorization: Bearer <jwt>

{
  "title": "European Capitals",
  "cardCount": 16,
  "pairs": [
    { "term": "France", "definition": "Paris" },
    { "term": "Germany", "definition": "Berlin" },
    { "term": "Italy", "definition": "Rome" },
    { "term": "Spain", "definition": "Madrid" },
    { "term": "Poland", "definition": "Warsaw" },
    { "term": "Netherlands", "definition": "Amsterdam" },
    { "term": "Belgium", "definition": "Brussels" },
    { "term": "Austria", "definition": "Vienna" }
  ],
  "isPublic": true,
  "tags": ["geography", "europe"]
}
```

**Response (201):**
```json
{
  "message": "Board created with 1 level/s"
}
```

### Sukces – wiele poziomów (20 par → 3 poziomy)

**Request:**
```http
POST /api/boards
Content-Type: application/json

{
  "title": "World Capitals Advanced",
  "cardCount": 16,
  "pairs": [
    // 20 par (każda para: term + definition)
    // Zostanie podzielone na: 8 + 8 + 4 = 3 poziomy
  ],
  "isPublic": false
}
```

**Response (201):**
```json
{
  "message": "Board created with 3 level/s"
}
```

### Błąd – duplikat tytułu

**Response (409):**
```json
{
  "error": "duplicate_board",
  "message": "A board with the same title and level already exists."
}
```

### Błąd – walidacja

**Request:** (term za długi)

**Response (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "pairs.0.term",
      "message": "Term must not exceed 255 characters"
    }
  ]
}
```
