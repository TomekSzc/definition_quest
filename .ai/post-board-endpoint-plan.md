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

- `CreateBoardCmd` – model komend wejściowych (już w `src/types.ts`).
- `BoardDetailDTO` – pełne DTO odpowiedzi.
- `PairCreateCmd`, `PairDTO` – modele par.
- Dodatkowo powstanie `CreateBoardSchema` (`zod`).

## 4. Szczegóły odpowiedzi

| Kod | Odpowiedź             | Opis                                      |
| --- | --------------------- | ----------------------------------------- |
| 201 | `BoardDetailDTO[]`    | Utworzono **≥1** tablic (level-based).    |
| 400 | `{ error, details? }` | Błąd walidacji danych wejściowych.        |
| 401 | `{ error }`           | Brak uwierzytelnienia.                    |
| 409 | `{ error }`           | Konflikt unikalności (duplikat tytułu).   |
| 429 | `{ error }`           | Przekroczony limit operacji (przyszłość). |
| 500 | `{ error }`           | Nieoczekiwany błąd serwera.               |

## 5. Przepływ danych

1. `middleware/index.ts` uwierzytelnia request i dodaje `locals.user`, `locals.supabase`.
2. **Router:** `src/pages/api/boards/index.ts` (nowy plik) odbiera `POST`.
3. Parsowanie JSON + walidacja `CreateBoardSchema`.
4. Wywołanie `createBoard` w serwisie `board.service.ts`:
   1. Rozpocznij transakcję.
   2. **Podziel `pairs` na segmenty** po `cardCount/2` (np. 8 lub 12 par).
   3. **Dla każdego segmentu** (index → `level`):
      - INSERT do `boards` (`level = idx + 1`).
      - Bulk INSERT odpowiadających par.
   4. Commit; zwróć listę utworzonych tablic + par.
5. Router buduje `BoardDetailDTO` i zwraca 201.
6. Ewentualne błędy → mapowanie na kody HTTP poprzez `utils/api-response`.

## 6. Względy bezpieczeństwa

- **RLS:** obowiązuje – właściciel (`owner_id`) = `auth.uid()`.
- **Autoryzacja:** sprawdzana w middleware; anonimowi otrzymają 401.
- **Walidacja** po stronie aplikacji + constrainty DB:
  - CHECK `card_count`, `tags`, UNIQUE `(owner_id, title, level)`.
- **SQL injection** niewystępujące – Supabase klient parametryzuje.
- **Brak XSS** – dane przechowywane bez wykonania w kliencie.

## 7. Obsługa błędów

| Sytuacja                               | Błąd                 | Kod |
| -------------------------------------- | -------------------- | --- |
| Parse JSON / Zod fail / >100 pairs     | `ValidationError`    | 400 |
| `locals.user` brak                     | `HttpError`          | 401 |
| Duplikat (unique owner_id+title+level) | `PgUniqueViolation`→ | 409 |
| RLS odrzuca (theoretically)            | `PostgrestError`     | 404 |
| Inne niespodziewane                    | log & generic        | 500 |

## 8. Rozważania dotyczące wydajności

- **Batch insert** par oraz wielokrotny INSERT tablic w jednej transakcji.
- Ograniczenia wejścia (`≤24` par) minimalizują obciążenie.
- Transakcja eliminuje konieczność manualnego rollbacku.

## 9. Etapy wdrożenia

1. **Typy** – utworzyć `CreateBoardSchema` (`src/lib/validation/boards.ts`).
2. **Serwis** – dodać `createBoard` do `board.service.ts` (preferowane czyste oddzielenie AI).
3. **API Route** – `src/pages/api/boards/index.ts` z obsługą `POST`.
4. **Mapowanie błędów** – zaktualizować `getErrorMapping` w `utils/api-response`.
5. **Testy jednostkowe** – walidacja schematu + serwis (mock Supabase).
6. **E2E (Postman / Thunder)** – scenariusze pozytywny, błędy 400/401/409.
7. **Dokumentacja** – OpenAPI / README uzupełnić przykładami.
8. **Code review & deploy** – verify RLS, run migrations (brak nowych tabel).
