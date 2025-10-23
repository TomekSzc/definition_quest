# Plan wdrożenia usługi OpenRouter

## 1. Opis usługi
Usługa **OpenRouterService** zapewnia ustandaryzowany interfejs do komunikacji z API [openrouter.ai](https://openrouter.ai).  
Jej główne cele:
- Uproszczenie budowania zapytań do LLM poprzez przyjazny, typowany interfejs.
- Obsługa całego cyklu życia żądania: walidacja, wysyłka, retry, parsowanie i logowanie.
- Zapewnienie zunifikowanej obsługi błędów i mechanizmów bezpieczeństwa (rate-limit, timeouts, sanitizacja danych).
- Możliwość łatwej rozbudowy o streaming, cache czy kolejne endpointy OpenRouter.

## 2. Opis konstruktora
```ts
class OpenRouterService {
  constructor(private readonly apiKey: string, private readonly baseUrl = 'https://openrouter.ai/api/v1') {}
}
```
Parametry:
1. **apiKey** – klucz API pobierany z zmiennej środowiskowej `OPENROUTER_API_KEY`.
2. **baseUrl** *(opc.)* – adres bazowy API; pozwala na łatwe mockowanie w testach.

## 3. Publiczne metody i pola
| Metoda | Zwraca | Opis |
|--------|--------|------|
| `chatCompletion(messages, options?)` | `Promise<ChatCompletion>` | Wysyła pełne zapytanie *chat/completions*. |
| `models()` | `Promise<Model[]>` | Zwraca listę dostępnych modeli. |
| `setDefaultParams(params)` | `void` | Ustawia parametry domyślne (temperature, top_p itp.). |

### Typy wejściowe/wyjściowe
```ts
type Message = { role: 'system' | 'user' | 'assistant'; content: string };
interface ChatOptions {
  model?: string;
  responseFormat?: JsonSchemaFormat;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  timeoutMs?: number; // lokalny timeout zapytania
}
interface ChatCompletion {
  content: string;          // surowa odpowiedź modelu
  json?: unknown;           // sparsowana odpowiedź JSON (o ile responseFormat ustawiono)
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}
```

## 4. Prywatne metody i pola
| Metoda | Opis |
|--------|------|
| `buildRequestBody(messages, options)` | Konstruuje body żądania zgodne z specyfikacją OpenRouter. |
| `handleResponse(res, responseFormat?)` | Sprawdza status HTTP, parsuje JSON i waliduje schemat. |
| `retry<T>(fn)` | Prostolinijna logika *exponential back-off* dla 429/5xx. |
| `log(level, message, extra?)` | Adaptor do biblioteki logującej (np. Pino). |

Pola prywatne:
- `defaultParams` – obiekt trzymający ustawienia domyślne.
- `MAX_RETRIES = 3` – limit ponowień.

## 5. Obsługa błędów
| # | Scenariusz | Reakcja |
|---|------------|---------|
| 1 | Brak/niepoprawny `apiKey` | Rzutuj `AuthenticationError`, HTTP 401. |
| 2 | 4xx (422, 429) z OpenRouter | Retry (gdy 429) lub `BadRequestError` z wiadomością serwera. |
| 3 | 5xx lub timeout | Retry + `ServiceUnavailableError` po wyczerpaniu limitu. |
| 4 | Błędny JSON w odpowiedzi | `ParseError` + treść odpowiedzi w logach. |
| 5 | Niezgodność z `responseFormat` | `SchemaValidationError` (z biblioteki `zod`/`ajv`). |

## 6. Kwestie bezpieczeństwa
1. **Przechowywanie kluczy** – `OPENROUTER_API_KEY` w pliku obecny w istniejącym pliku `.env`, odczytywany przez `environment.ts` i niecommitowany do repo.(już jest dodany do gitignore)
2. **Rate limiting** – lokalny semafor lub `p-limit` + retry-after dla 429.
3. **Sanityzacja promptu** – usuwanie potencjalnych wstrzyknięć kodu, logowanie tylko zahashowanych treści (RODO/GDPR).
4. **TLS** – wymuszanie HTTPS; odrzucenie nie-TLS (np. przez testowe proxy).

## 7. Plan wdrożenia krok po kroku

### 7.1 Przygotowanie środowiska
1. `npm i openai zod p-limit` – zależności runtime.
2. `npm i -D @types/node cross-env` – dev-deps.
3. Dopisz do `tsconfig.json` **`"resolveJsonModule": true`** (jeśli brak).

### 7.2 Implementacja
1. **Struktura**: `src/lib/services/openrouter.service.ts`  
   + kokpit prywatnych metod i expose public API.
2. **Walidacja opcji**: wykorzystaj `zod` do schematów `ChatOptions` i `JsonSchemaFormat`.
3. **Retry**: zaimplementuj `retry` z `p-retry` lub własnym back-offem.
4. **Schema-based parsing**: jeżeli `responseFormat` zawiera `json_schema`, użyj `Ajv`/`zod` do walidacji i parsowania odpowiedzi.

### 7.3 Integracja z Astro
1. W `src/pages/api/...` importuj `OpenRouterService` i twórz instancję z `env.OPENROUTER_API_KEY`.
2. Dodaj globalny *error boundary* (middleware) do mapowania Error → HTTP.
3. Zapewnij SSR-safe wywołania (brak klucza w kliencie).



### 7.4 Utrzymanie
- Agreguj metryki czasu odpowiedzi i kosztów tokenów.
- Aktualizuj listę modeli poprzez `models()` w czasie builda i cache w kv-store.

---

## Załącznik A – Przykłady użycia elementów OpenRouter API

### A.1 Komunikat systemowy (system message)
```ts
const sysMsg: Message = {
  role: 'system',
  content: 'Jesteś asystentem pomagającym w tworzeniu aplikacji Astro.'
};
```

### A.2 Komunikat użytkownika (user message)
```ts
const userMsg: Message = {
  role: 'user',
  content: 'Wytłumacz różnicę między Astro a Next.js.'
};
```

### A.3 response_format z JSON-schema
```ts
const responseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'ExplainDifference',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        answer: { type: 'string' },
        sources: {
          type: 'array',
          items: { type: 'string', format: 'uri' }
        }
      },
      required: ['answer']
    }
  }
} as const;
```

### A.4 Nazwa modelu
```ts
const model = 'openai/gpt-4o-mini';
```

### A.5 Parametry modelu
```ts
const params = {
  temperature: 0.7,
  top_p: 1.0,
  frequency_penalty: 0.0,
  presence_penalty: 0.0
};
```

### A.6 Pełny przykład wywołania
```ts
const service = new OpenRouterService(process.env.OPENROUTER_API_KEY!);
const completion = await service.chatCompletion(
  [sysMsg, userMsg],
  {
    model,
    responseFormat,
    ...params
  }
);
console.log(completion.json?.answer);
```
