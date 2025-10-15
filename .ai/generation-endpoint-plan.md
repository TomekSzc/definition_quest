# API Endpoint Implementation Plan: POST /ai/boards/generate

## 1. Przegląd punktu końcowego
Endpoint asynchronicznie generuje parę termin–definicja z surowego tekstu (≤ 5 000 znaków) i zapisuje gotową tablicę kart (board) w pojedynczym wywołaniu. Operacja zlicza się do dobowego limitu 50 żądań AI na użytkownika. Zwraca `202 Accepted` wraz z identyfikatorem zadania i kanałem WebSocket do subskrypcji postępów. Po ukończeniu zadania nowa tablica pojawi się w standardowych punktach końcowych `/boards/*`.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST  
- **URL:** `/ai/boards/generate`  
- **Nagłówki wymagane:**  
  - `Content-Type: application/json`  
  - `Authorization: Bearer <JWT>` (użytkownik musi być zalogowany)
- **Parametry ścieżki / query:** brak  
- **Request Body (JSON):**
  | Pole | Typ | Wymagane | Walidacja |
  |------|-----|----------|-----------|
  | `title` | string | ✓ | 1–120 znaków |
  | `inputText` | string | ✓ | ≤ 5 000 znaków |
  | `cardCount` | 16 &#124; 24 | ✓ | literal 16 lub 24 |
  | `isPublic` | boolean | ✓ | — |
  | `tags` | string[] | ✕ | ≤ 10 elementów, każdy ≤ 20 znaków |

*Zgodny model:* `GenerateBoardCmd` z `src/types.ts`.

## 3. Wykorzystywane typy
- **Command / Input:** `GenerateBoardCmd`
- **Encje BD:** `boards`, `pairs`, `ai_requests`, materialized view `daily_ai_usage`
- **DTO wyjściowe:**
  ```ts
  interface BoardGenerationEnqueuedDTO {
    jobId: string;         // uuid z ai_requests.id
    wsChannel: string;     // np. "ai:requests:<jobId>"
  }
  ```
- **Inne:** `AiRequestRow`, `BoardDetailDTO` (po stronie konsumenta po ukończeniu zadania)

## 4. Szczegóły odpowiedzi
| Kod | Warunek | Treść |
|-----|---------|-------|
| `202 Accepted` | Zadanie poprawnie zarejestrowane | `BoardGenerationEnqueuedDTO` |
| `400 Bad Request` | Walidacja danych wejściowych nie powiodła się | `{"error":"<message>"}` |
| `401 Unauthorized` | Brak lub niepoprawny token | — |
| `429 Too Many Requests` | Przekroczono dzienny limit 50 zapytań | `{"error":"quota_exceeded"}` |
| `500 Internal Server Error` | Błąd wewnętrzny (np. OpenRouter) | `{"error":"internal"}` |

## 5. Przepływ danych
1. **Auth ⇢** Astro middleware weryfikuje JWT i udostępnia `locals.supabase`.  
2. **Quota check ⇢** Zapytanie do widoku `daily_ai_usage` (`count < 50`).  
3. **Walidacja Zod ⇢** `GenerateBoardSchema` z ograniczeniami z §2.  
4. **Insert ai_requests (pending) ⇢** status = `pending`, koszt/promptTokens = 0.  
5. **Publikacja zadania** do kolejki (np. `edge_functions.invoke('generate_board', payload)`).  
6. **Odpowiedź 202** z `jobId`, `wsChannel`.  
7. **Edge Function**:  
   - Zlicza tokeny/cenę, woła OpenRouter, generuje `pairs[]`.  
   - Transakcja supabase: `insert boards`, `insert pairs`, `update ai_requests` status =`ok` + koszty.  
   - Na wyjątek → `update ai_requests` status =`error`.  
   - Publikuje wiadomość na Realtime kanał `ai:requests:<jobId>`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie:** JWT (Supabase Auth).  
- **Autoryzacja:** RLS – wstawienia w `boards` i `pairs` odbywają się w Edge Function z rolą `service_role`, ale owner_id = auth.uid() przekazany eksplicytnie.  
- **Walidacja + Sanity-check:** długości pól, dozwolone wartości, filtrowanie HTML/SQL injection (OpenAI → escape).  
- **Rate Limit / Quota:** limit 50/doba w SQL + zapobieganie wyścigom (SELECT FOR UPDATE na liczniku lub w transakcji).  
- **Ochrona kosztów:** hard-limit długości `inputText`, odrzucanie > 5 000 znaków.

## 7. Obsługa błędów
| Scenariusz | Kod | Działanie |
|------------|-----|-----------|
| Niezalogowany | 401 | Return 401, brak zapisu do BD |
| Niepoprawny JSON / walidacja Zod | 400 | Szczegół w `error` |
| Limit 50/doba | 429 | Bez wpisu `ai_requests` |
| Błąd OpenRouter | 500 | `ai_requests.status = 'error'` + log, zwrot 500 jeśli w synchronicznej części |
| Błąd BD | 500 | Rollback transakcji, log serwera |

## 8. Rozważania dotyczące wydajności
- Operacja synchroniczna jest lekka (insert + publikacja), właściwa AI jest asynchroniczna.  
- Indeksy już zdefiniowane (`boards.owner_id`, `ai_requests.user_id, requested_at`).  
- Pamiętać o batch-insert `pairs[]` w jednej operacji.  
- Używać `select count(*)` z cache do sprawdzenia limitu (widok materializowany).  
- Limity czasu dla Edge Function (np. 30 s) + ewentualny retry.

## 9. Etapy wdrożenia
1. **Specyfikacja Zod** – `src/lib/validation/boards.ts` ➜ `GenerateBoardSchema`.  
2. **Service layer** – `src/lib/services/board-ai.service.ts` z funkcją `enqueueGeneration`.  
3. **Endpoint** – `src/pages/api/ai/boards/generate.ts` z `export const POST`.  
4. **Edge Function** – `supabase/functions/generate_board/index.ts`.  
5. **Realtime channel naming** – konwencja `ai:requests:<uuid>`.  
7. **Monitoring & Logs** – dashboard kosztów + alerty.  
