# API Endpoint Implementation Plan: Submit Board Score (`POST /boards/:boardId/scores`)

## 1. Przegląd punktu końcowego
Punkt końcowy pozwala zalogowanemu użytkownikowi **zapisać** czas ukończenia gry w milisekundach dla wskazanej tablicy. Dla MVP przechowujemy **wyłącznie ostatni zgłoszony czas** – każdorazowe wywołanie nadpisuje poprzednią wartość.

## 2. Szczegóły żądania
- **Metoda HTTP:** `POST`
- **URL:** `/boards/:boardId/scores`
  - `:boardId` (`uuid`) – identyfikator tablicy – wymagany
- **Request Body (JSON):**
  ```jsonc
  { "elapsedMs": 93400 }
  ```
  - `elapsedMs` `number` > 0 – czas w milisekundach – wymagany
- **Nagłówki:**
  - `Authorization: Bearer <JWT>` — token Supabase (wymagany)

## 3. Wykorzystywane typy
- **Command Model**: `ScoreSubmitCmd`
- **DTO Odpowiedzi** (minimalne):
  ```ts
  interface SubmitScoreDTO {
    id: string;       // uuid rekordu w scores
    elapsedMs: number;
  }
  ```

## 4. Szczegóły odpowiedzi
| Kod | Scenariusz | Body |
|-----|------------|------|
|201|Rekord utworzony|`SubmitScoreDTO`|
|200|Rekord zaktualizowany|`SubmitScoreDTO`|
|400|Błędne dane wejściowe|`{ error: "INVALID_INPUT" }`|
|401|Brak / nieważny JWT|`{ error: "UNAUTHORIZED" }`|
|404|Tablica nie istnieje lub brak dostępu|`{ error: "BOARD_NOT_FOUND" }`|
|500|Inny błąd serwera|`{ error: "SERVER_ERROR" }`|

## 5. Przepływ danych
1. **Route** `src/pages/api/boards/[boardId]/scores.ts` obsługuje metodę `POST`.
2. Z `context.locals` pobieramy `supabase` oraz `user`. Brak użytkownika ⇒ `401`.
3. Walidujemy body (`zod`: `elapsedMs > 0`).
4. Sprawdzamy istnienie tablicy (SELECT id FROM boards WHERE id=:boardId).
5. Wykonujemy **upsert** (nadpisuje bez warunku):
   ```ts
   const { data, error } = await supabase.from("scores").upsert(
     {
       id: uuid(), // użyty tylko przy pierwszym zapisie
       user_id: user.id,
       board_id: boardId,
       elapsed_ms: elapsedMs,
     },
     {
       onConflict: "user_id,board_id",
       ignoreDuplicates: false, // aktualizuje, nie ignoruje
     },
   ).select("id, elapsed_ms").single();
   ```
6. Jeżeli `data` zawiera nowy wiersz ⇒ `201`; w przeciwnym razie `200`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie:** JWT Supabase.
- **Autoryzacja:**
  - RLS `boards` – dostęp tylko dla publicznych lub właściciela.
  - RLS `scores` – polityka `owner_full_access` pozwala INSERT/UPDATE właścicielowi.
- **Walidacja:** `zod`.

## 7. Obsługa błędów
| Błąd | Detekcja | Kod |
|------|---------|-----|
|Nieautoryzowany|`!user`|401|
|Błędne body|`z.safeParse` fail|400|
|Tablica nie istnieje|`boards` query empty|404|
|Błąd DB|`error` z Supabase|500|

## 8. Rozważania dotyczące wydajności
- Upsert w pojedynczym zapytaniu zmniejsza liczbę round-tripów.
- Indeksy `(user_id, board_id)` zapewniają wydajność.

## 9. Etapy wdrożenia
1. **Validation schema** `src/lib/validation/scores.ts`.
2. **Service** `src/lib/services/score.service.ts` z funkcją `upsertScore`.
3. **API Route** `scores.ts` (POST): walidacja → `upsertScore` → odpowiedź.
4. **Frontend**: zawsze wysyła `POST`; otrzymuje zwrotnie „ostatni czas”.
5. **Przyszłość**: dodać kolumnę `best_elapsed_ms` + endpoint `PATCH`/logika leaderboard.
