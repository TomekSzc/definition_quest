# API Endpoint Implementation Plan: POST /boards/generate

## 1. Przegląd punktu końcowego

Endpoint synchronicznie generuje pary termin–definicja z surowego tekstu (≤ 5 000 znaków) używając AI przez OpenRouter API (model: `openai/gpt-4o-mini`). Operacja zlicza się do dobowego limitu 50 żądań AI na użytkownika. Zwraca `200 OK` z wygenerowanymi parami (do 50 sztuk), które użytkownik może edytować przed utworzeniem planszy przez osobne wywołanie `POST /boards`.

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

_Zgodny model:_ `GenerateBoardCmd` z `src/types.ts`.

## 3. Wykorzystywane typy

- **Command / Input:** `GenerateBoardCmd`
- **Encje BD:** 
  - `ai_requests` (tabela auditowa, pola: `id`, `user_id`, `status`, `model`, `prompt_tokens`, `cost_usd`, `requested_at`)
    - **Uwaga:** pole `prompt_tokens` przechowuje `total_tokens` (suma input + output)
  - `daily_ai_usage` (materialized view dla sprawdzania limitu, pola: `user_id`, `request_date`, `cnt`)
- **DTO wyjściowe:**

  ```ts
  interface BoardGenerationResultDTO {
    pairs: GeneratedPair[]; // wygenerowane pary do edycji
    requestId: string; // uuid z ai_requests.id dla trackingu
  }

  interface GeneratedPair {
    term: string;
    definition: string;
  }
  ```

- **Inne:** `AiRequestRow`

## 4. Szczegóły odpowiedzi

| Kod                         | Warunek                                                                     | Treść                                         |
| --------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `200 OK`                    | Pary wygenerowane pomyślnie                                                 | `BoardGenerationResultDTO`                    |
| `400 Bad Request`           | Walidacja danych wejściowych nie powiodła się lub input_text pusty/za długi | `{"error":"<code>", "message":"<details>"}`   |
| `401 Unauthorized`          | Brak lub niepoprawny token (obsługiwane przez middleware)                   | `{"error":"Unauthorized"}`                    |
| `429 Too Many Requests`     | Przekroczono dzienny limit 50 zapytań                                       | `{"error":"quota_exceeded", "message":"..."}` |
| `500 Internal Server Error` | Błąd wewnętrzny                                                             | `{"error":"Internal server error"}`           |

## 5. Przepływ danych

1. **Auth ⇢** Astro middleware automatycznie weryfikuje JWT i dodaje `user` do `locals`.
2. **Walidacja Zod ⇢** `GenerateBoardSchema` waliduje `inputText`, `cardCount`, etc.
3. **Service layer (`generateBoardPairs`) ⇢** 
   - Walidacja długości `inputText` (max 5000 znaków) i pustego tekstu
   - Walidacja `cardCount` (16 lub 24)
   - **Quota check** – sprawdzenie limitu w widoku `daily_ai_usage` (`count < 50`)
4. **Insert ai_requests (pending) ⇢** status = `pending`, model = `openai/gpt-4o-mini`, initial tokens = 0, cost = 0.
5. **Generowanie par przez OpenRouter API**:
   - Wywołanie `generatePairsWithAI()` z promptem systemowym i user promptem
   - Model: `openai/gpt-4o-mini` z temperature = 0.7
   - Format odpowiedzi: JSON Schema (strict mode) wymuszający strukturę `{pairs: [{term, definition}]}`
   - Generowanie do 50 par (nie ograniczone do cardCount/2)
   - Walidacja odpowiedzi AI (format, niepuste pola, prawidłowe typy)
6. **Obliczanie kosztów ⇢** Kalkulacja na podstawie tokenów: $0.15/1M input + $0.60/1M output tokens.
7. **Update ai_requests (completed) ⇢** status = `completed`, `prompt_tokens` zawiera total_tokens, `cost_usd` z rzeczywistą wartością.
8. **Odpowiedź 200 OK** z `pairs[]` (do 50 sztuk) i `requestId`.
9. **Klient** otrzymuje pary, może je edytować, następnie używa `POST /boards` do utworzenia planszy.

**Obsługa błędów podczas generowania:**
- W przypadku błędu OpenRouter lub walidacji: status w `ai_requests` ustawiany na `failed`
- Błędy OpenRouter mapowane na `AI_SERVICE_ERROR: <message>`

## 6. Strategia promptów AI

### System Prompt
Instrukcja dla AI definiująca rolę i wymagania:
- Rola: ekspert w tworzeniu materiałów edukacyjnych
- Zadanie: ekstrakcja najważniejszych pojęć jako pary termin–definicja
- **Wymagania dotyczące par:**
  - Maksymalnie 50 par (tyle ile możliwe, nie przekraczając limitu)
  - **Terminy:** 1-4 słowa (kluczowe pojęcia, nazwy, terminy techniczne)
  - **Definicje:** 5-15 słów (jasne, zwięzłe wyjaśnienia)
  - Koncentracja na najważniejszych konceptach
  - Różnorodność (unikanie powtórzeń)
  - Język dopasowany do inputu (domyślnie polski)
  - Definicje samowystarczalne (zrozumiałe bez kontekstu)

### User Prompt
Format:
```
Title: {title}

Input text:
{inputText}

Generate term-definition pairs (max 50) from the above content.
```

### Parametry modelu
- **Model:** `openai/gpt-4o-mini`
- **Temperature:** 0.7 (balans między kreatywnością a konsystencją)
- **Top P:** 1.0 (pełna próba tokenów)
- **Response Format:** JSON Schema (strict mode)

### JSON Schema
```ts
{
  type: "json_schema",
  json_schema: {
    name: "GeneratedPairs",
    strict: true,
    schema: {
      type: "object",
      properties: {
        pairs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              term: { type: "string" },
              definition: { type: "string" }
            },
            required: ["term", "definition"],
            additionalProperties: false
          },
          minItems: 1,
          maxItems: 50
        }
      },
      required: ["pairs"],
      additionalProperties: false
    }
  }
}
```

**Uwaga:** Wartość `cardCount` z requestu (16 lub 24) NIE limituje liczby generowanych par. AI może zwrócić do 50 par niezależnie od `cardCount`. Klient może następnie wybrać i edytować pary przed utworzeniem planszy. Jeśli jest więcej par niż `cardCount/2`, system automatycznie utworzy wiele poziomów.

## 7. Względy bezpieczeństwa

- **Uwierzytelnienie:** JWT weryfikowany automatycznie przez middleware (`src/middleware/index.ts`).
- **Autoryzacja:** User dostępny w `locals.user`, tylko zalogowani użytkownicy mogą generować pary.
- **Walidacja wielopoziomowa:**
  - **Endpoint level:** Zod schema (`GenerateBoardSchema`) waliduje podstawowy format
  - **Service level:** Dodatkowa walidacja w `generateBoardPairs()`:
    - `inputText.length` ≤ 5000 (hard-limit)
    - `inputText.trim()` nie może być pusty
    - `cardCount` ściśle 16 lub 24
  - **AI response level:** Walidacja struktury i zawartości odpowiedzi AI:
    - Format JSON zgodny z JSON Schema
    - Każda para ma `term` i `definition` jako niepuste string
    - Maksymalnie 50 par
- **Rate Limit / Quota:**
  - Limit 50/doba sprawdzany **przed** utworzeniem `ai_requests` (fail-fast)
  - Materialized view `daily_ai_usage` dla wydajności i spójności
  - Quota sprawdzany per user_id + request_date
- **Auditing:** Każde żądanie rejestrowane w `ai_requests` z pełnym trackingiem (status, tokeny, koszt, timestamp)
- **Error mapping:** Spójne i bezpieczne odpowiedzi błędów przez `getErrorMapping()` (nie leak'ują detali implementacji)

## 8. Obsługa błędów

| Scenariusz                 | Kod | Działanie                                                      |
| -------------------------- | --- | -------------------------------------------------------------- |
| Niezalogowany              | 401 | Middleware zwraca 401 przed dotarciem do endpointu             |
| Niepoprawny JSON           | 400 | `createErrorResponse("Invalid JSON in request body", 400)`     |
| Walidacja Zod              | 400 | Szczegółowe błędy walidacji w `details` array                  |
| `INPUT_TEXT_EMPTY`         | 400 | Mapped error response przez `getErrorMapping()`                |
| `INPUT_TEXT_TOO_LONG`      | 400 | Mapped error response przez `getErrorMapping()`                |
| `INVALID_CARD_COUNT`       | 400 | Mapped error response przez `getErrorMapping()`                |
| `QUOTA_EXCEEDED`           | 429 | Mapped error response, brak utworzenia `ai_requests`           |
| `AI_INVALID_RESPONSE_FORMAT` | 500 | `ai_requests.status = 'failed'`, AI zwróciło nieprawidłowy format |
| `AI_INVALID_PAIR_FORMAT`   | 500 | `ai_requests.status = 'failed'`, para nie przeszła walidacji   |
| `AI_SERVICE_ERROR`         | 500 | `ai_requests.status = 'failed'`, błąd OpenRouter API           |
| Błąd generowania           | 500 | `ai_requests.status = 'failed'`, log + generic error           |
| Błąd BD                    | 500 | Log serwera, generic error response                            |

## 9. Rozważania dotyczące wydajności

- Operacja synchroniczna z realnym wywołaniem OpenRouter API.
- Czas odpowiedzi: zazwyczaj 2-10s w zależności od długości `inputText` i modelu.
- Model `openai/gpt-4o-mini` wybrany dla optymalnego balansu między szybkością a jakością.
- Indeksy zdefiniowane w BD: `ai_requests.user_id`, `requested_at`.
- Widok materializowany `daily_ai_usage` dla efektywnego sprawdzania limitu (bez pełnego skanowania tabeli).
- Structured Output (JSON Schema strict mode) zapewnia przewidywalny format odpowiedzi bez potrzeby parsowania.
- Koszty: ~$0.0001-0.0005 USD za typowe żądanie (w zależności od długości tekstu).

## 10. Etapy wdrożenia

1. ✅ **Typy** – `GenerateBoardCmd`, `BoardGenerationResultDTO`, `GeneratedPair` w `src/types.ts`.
2. ✅ **Specyfikacja Zod** – `GenerateBoardSchema` w `src/lib/validation/boards.ts`.
3. ✅ **Service layer** – `src/lib/services/board-ai.service.ts` z funkcjami:
   - `generateBoardPairs()` – główna funkcja generowania z pełnym flow
   - `checkDailyQuota()` – sprawdzanie limitu przez `daily_ai_usage` view
   - `getRemainingQuota()` – pobieranie pozostałej kwoty
   - `generatePairsWithAI()` – integracja z OpenRouter API
   - `calculateCost()` – kalkulacja kosztów USD na podstawie tokenów
4. ✅ **API utilities** – `src/lib/utils/api-response.ts` z helperami:
   - `createErrorResponse()` – spójne error responses
   - `createSuccessResponse()` – spójne success responses
   - `getErrorMapping()` – mapowanie błędów biznesowych
5. ✅ **Middleware** – `src/middleware/index.ts` z automatyczną autentykacją JWT.
6. ✅ **Endpoint** – `src/pages/api/boards/generate.ts` z `export const POST`.
7. ✅ **Integracja OpenRouter** – pełna integracja z `openai/gpt-4o-mini`:
   - Structured Output (JSON Schema strict mode)
   - Walidacja formatu odpowiedzi AI
   - Tracking tokenów i kosztów
   - Obsługa błędów OpenRouter
8. ✅ **OpenRouter Service** – `src/lib/services/openrouter.service.ts` + factory
9. 🔜 **Monitoring & Logs** – dashboard kosztów + alerty do implementacji w przyszłości.
