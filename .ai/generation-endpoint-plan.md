# API Endpoint Implementation Plan: POST /boards/generate

## 1. Przegląd punktu końcowego
Endpoint synchronicznie generuje pary termin–definicja z surowego tekstu (≤ 5 000 znaków) używając AI (obecnie mock). Operacja zlicza się do dobowego limitu 50 żądań AI na użytkownika. Zwraca `200 OK` z wygenerowanymi parami, które użytkownik może edytować przed utworzeniem planszy przez osobne wywołanie `POST /boards`.

## 2. Szczegóły żądania
- **Metoda HTTP:** POST  
- **URL:** `/boards/generate`  
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
- **Encje BD:** `ai_requests`, materialized view `daily_ai_usage`
- **DTO wyjściowe:**
  ```ts
  interface BoardGenerationResultDTO {
    pairs: GeneratedPair[];  // wygenerowane pary do edycji
    requestId: string;       // uuid z ai_requests.id dla trackingu
  }
  
  interface GeneratedPair {
    term: string;
    definition: string;
  }
  ```
- **Inne:** `AiRequestRow`

## 4. Szczegóły odpowiedzi
| Kod | Warunek | Treść |
|-----|---------|-------|
| `200 OK` | Pary wygenerowane pomyślnie | `BoardGenerationResultDTO` |
| `400 Bad Request` | Walidacja danych wejściowych nie powiodła się lub input_text pusty/za długi | `{"error":"<code>", "message":"<details>"}` |
| `401 Unauthorized` | Brak lub niepoprawny token (obsługiwane przez middleware) | `{"error":"Unauthorized"}` |
| `429 Too Many Requests` | Przekroczono dzienny limit 50 zapytań | `{"error":"quota_exceeded", "message":"..."}` |
| `500 Internal Server Error` | Błąd wewnętrzny | `{"error":"Internal server error"}` |

## 5. Przepływ danych
1. **Auth ⇢** Astro middleware automatycznie weryfikuje JWT i dodaje `user` do `locals`.  
2. **Walidacja Zod ⇢** `GenerateBoardSchema` waliduje `inputText`, `cardCount`, etc.  
3. **Quota check ⇢** Serwis sprawdza limit w widoku `daily_ai_usage` (`count < 50`).  
4. **Insert ai_requests (pending) ⇢** status = `pending`, model = `mock/gpt-4`.  
5. **Generowanie par**:  
   - **MVP:** Funkcja `generateMockPairs()` zwraca predefiniowane pary.  
   - **Produkcja:** Wywołanie OpenRouter API z `inputText`.  
6. **Update ai_requests (completed) ⇢** status = `completed`, prompt_tokens, cost_usd.  
7. **Odpowiedź 200 OK** z `pairs[]` i `requestId`.  
8. **Klient** otrzymuje pary, może je edytować, następnie używa `POST /boards` do utworzenia planszy.

## 6. Względy bezpieczeństwa
- **Uwierzytelnienie:** JWT weryfikowany automatycznie przez middleware (`src/middleware/index.ts`).  
- **Autoryzacja:** User dostępny w `locals.user`, tylko zalogowani użytkownicy mogą generować pary.  
- **Walidacja + Sanity-check:** 
  - Zod schema waliduje wszystkie pola wejściowe
  - `inputText` max 5000 znaków (hard-limit w serwisie)
  - `cardCount` tylko 16 lub 24
  - Puste `inputText` odrzucane
- **Rate Limit / Quota:** 
  - Limit 50/doba sprawdzany przed generowaniem
  - Materialized view `daily_ai_usage` dla wydajności
- **Error mapping:** Spójne odpowiedzi błędów przez `getErrorMapping()`

## 7. Obsługa błędów
| Scenariusz | Kod | Działanie |
|------------|-----|-----------|
| Niezalogowany | 401 | Middleware zwraca 401 przed dotarciem do endpointu |
| Niepoprawny JSON | 400 | `createErrorResponse("Invalid JSON in request body", 400)` |
| Walidacja Zod | 400 | Szczegółowe błędy walidacji w `details` array |
| `INPUT_TEXT_EMPTY` | 400 | Mapped error response przez `getErrorMapping()` |
| `INPUT_TEXT_TOO_LONG` | 400 | Mapped error response przez `getErrorMapping()` |
| `INVALID_CARD_COUNT` | 400 | Mapped error response przez `getErrorMapping()` |
| `QUOTA_EXCEEDED` | 429 | Mapped error response, brak utworzenia `ai_requests` |
| Błąd generowania | 500 | `ai_requests.status = 'failed'`, log + generic error |
| Błąd BD | 500 | Log serwera, generic error response |

## 8. Rozważania dotyczące wydajności
- Operacja synchroniczna (MVP) z mockiem jest bardzo szybka (< 100ms).  
- Produkcyjne wywołanie OpenRouter API może trwać 2-10s w zależności od modelu.  
- Indeksy już zdefiniowane (`ai_requests.user_id, requested_at`).  
- Widok materializowany `daily_ai_usage` dla efektywnego sprawdzania limitu.  
- W przyszłości można rozważyć async flow dla długich generacji.

## 9. Etapy wdrożenia (✅ Zakończone w MVP)
1. ✅ **Typy** – `GenerateBoardCmd`, `BoardGenerationResultDTO`, `GeneratedPair` w `src/types.ts`.  
2. ✅ **Specyfikacja Zod** – `GenerateBoardSchema` w `src/lib/validation/boards.ts`.  
3. ✅ **Service layer** – `src/lib/services/board-ai.service.ts` z funkcjami:
   - `generateBoardPairs()` – główna funkcja generowania
   - `checkDailyQuota()` – sprawdzanie limitu
   - `getRemainingQuota()` – pobieranie pozostałej kwoty
   - `generateMockPairs()` – mock dla MVP
4. ✅ **API utilities** – `src/lib/utils/api-response.ts` z helperami:
   - `createErrorResponse()` – spójne error responses
   - `createSuccessResponse()` – spójne success responses  
   - `getErrorMapping()` – mapowanie błędów biznesowych
5. ✅ **Middleware** – `src/middleware/index.ts` z automatyczną autentykacją.
6. ✅ **Endpoint** – `src/pages/api/boards/generate.ts` z `export const POST`.
7. 🔜 **Integracja OpenRouter** – zamiana mocka na prawdziwe API (produkcja).
8. 🔜 **Monitoring & Logs** – dashboard kosztów + alerty.  
