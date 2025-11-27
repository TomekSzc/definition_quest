# Changelog

## [Unreleased]

### Added

- **Astro Env API Integration** – Wdrożono `astro:env` dla lepszej obsługi zmiennych środowiskowych
  - Konfiguracja schema w `astro.config.mjs` z opcjonalnymi zmiennymi
  - Zmienne `SUPABASE_URL` i `SUPABASE_KEY` z `context: "client"` (dostępne w przeglądarce)
  - Zmienna `OPENROUTER_API_KEY` z `context: "server"` i `access: "secret"`
  - Zmienna `ENV_NAME` z typem enum dla feature flags
  - Wykorzystanie `import.meta.env` dla uniwersalności (działa lokalnie, w testach, GitHub Actions i Cloudflare)
  - Automatyczne kopiowanie `.env.test` → `.env.local` w testach E2E przez `playwright.config.ts`
  - Czyszczenie `.env.local` po testach w `global-teardown.ts`
  - Dodano `ENV_SETUP.md` z dokumentacją konfiguracji dla wszystkich środowisk
  - Kompatybilność z GitHub Actions builds (zmienne z `process.env` → `import.meta.env`)
  - Kompatybilność z Cloudflare Pages runtime environment variables

- **OpenRouter AI Integration** – Full implementation of AI-powered board generation
  - `OpenRouterService` class for standardized API communication with openrouter.ai
  - Support for chat completions with JSON schema response formatting
  - Comprehensive error handling with custom error classes (AuthenticationError, RateLimitError, etc.)
  - Automatic retry logic with exponential backoff for transient failures
  - Rate limiting (5 concurrent requests) to prevent API throttling
  - Token usage tracking and cost calculation for gpt-4o-mini model
  - `createOpenRouterService()` factory function with dual environment support (Astro + Node.js)
  - Test endpoint at GET `/api/openrouter/test` for API connectivity verification
  - Comprehensive test scripts:
    - `npm run test:openrouter` - API connectivity and basic functionality
    - `npm run test:ai-generation` - End-to-end board pair generation test
  - Updated README with OpenRouter configuration instructions and pricing details
- **AI Board Generation** – Real AI-powered pair extraction
  - Replaced mock `generateMockPairs()` with `generatePairsWithAI()` using OpenRouter
  - Smart prompt engineering for educational content extraction
  - Structured JSON response with term-definition pairs validation
  - Automatic language detection (Polish/English) based on input text
  - Token usage and cost tracking stored in `ai_requests` table
  - Support for 8 or 12 pair generation (16 or 24 cards)

- PATCH `/api/boards/:id` – partial update of board metadata (title, isPublic, archived, tags).
  - Added `PatchBoardSchema` for request validation.
  - Added `updateBoardMeta` service function.
  - Updated API reference in README.

### Changed

- Updated `board-ai.service.ts` to use real OpenRouter API instead of mock data
- Enhanced error messages with AI service error codes
- `ai_requests.prompt_tokens` now stores total tokens (prompt + completion combined)
- Cost calculation uses accurate OpenRouter pricing ($0.15/$0.60 per 1M tokens)

### Technical

- Added dependencies: `openai`, `p-limit`, `tsx` (dev)
- Updated `tsconfig.json` with `resolveJsonModule: true`
- Enhanced `env.d.ts` with `OPENROUTER_API_KEY` type definition
