# Konfiguracja zmiennych środowiskowych

## Przegląd

Projekt używa `astro:env` API z opcjonalnym schema, co pozwala na uniwersalne działanie w różnych środowiskach.

## Jak to działa?

### 1. Schema w `astro.config.mjs`

Zmienne są zdefiniowane w schema z flagą `optional: true`:

```js
env: {
  schema: {
    SUPABASE_URL: envField.string({
      context: "client",
      access: "public",
      optional: true, // ✅ Pozwala na fallback do process.env
    }),
    // ... inne zmienne
  },
}
```

### 2. Użycie w kodzie

Kod używa `import.meta.env` który automatycznie działa we wszystkich środowiskach:

```ts
const supabaseUrl = import.meta.env.SUPABASE_URL;
```

## Środowiska

### 🏠 Lokalne (Development)

**Źródło zmiennych:** Pliki `.env`

```bash
npm run dev
```

Astro automatycznie ładuje:
- `.env` - bazowe zmienne
- `.env.development` - override dla dev
- `.env.local` - lokalne override (gitignored)

### 🧪 Testy E2E (Playwright)

**Źródło zmiennych:** `.env.test` → kopiowany do `.env.local`

```bash
npm run test:e2e
```

Proces:
1. `playwright.config.ts` kopiuje `.env.test` → `.env.local`
2. Astro dev server ładuje `.env.local` (najwyższy priorytet)
3. Po testach `global-teardown.ts` usuwa `.env.local`

### 🏗️ GitHub Actions (Build)

**Źródło zmiennych:** GitHub Secrets → `process.env`

```yaml
- name: Build for production
  run: npm run build
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

Vite automatycznie przekazuje `process.env` do `import.meta.env` podczas buildu.

### ☁️ Cloudflare Pages (Runtime)

**Źródło zmiennych:** Cloudflare Environment Variables

Zmienne ustawione w Cloudflare Dashboard są automatycznie dostępne przez `import.meta.env` w runtime.

## Hierarchia plików .env (od najwyższego priorytetu)

1. `.env.local` (nigdy nie commitowany, najwyższy priorytet)
2. `.env.development` / `.env.production` (zależnie od trybu)
3. `.env` (bazowe wartości, commitowany jako `.env.example`)

## Dodawanie nowych zmiennych

### 1. Dodaj do schema w `astro.config.mjs`

```js
env: {
  schema: {
    NEW_VARIABLE: envField.string({
      context: "server", // lub "client" jeśli potrzebna w przeglądarce
      access: "secret",   // lub "public"
      optional: true,     // ✅ Zawsze true dla kompatybilności
    }),
  },
}
```

### 2. Dodaj do `.env.example`

```bash
NEW_VARIABLE=###
```

### 3. Dodaj do GitHub Secrets

W ustawieniach repozytorium: Settings → Secrets and variables → Actions

### 4. Dodaj do Cloudflare Dashboard

Cloudflare Dashboard → Workers & Pages → [Twój projekt] → Settings → Environment variables

### 5. Dodaj do workflow jeśli potrzebne podczas buildu

```yaml
env:
  NEW_VARIABLE: ${{ secrets.NEW_VARIABLE }}
```

## Typy zmiennych

### `context: "client"`
- Dostępne w przeglądarce (bundle)
- Użyj dla publicznych API keys (np. Supabase public key)

### `context: "server"`
- Tylko server-side
- Użyj dla sekretnych kluczy (np. API keys)

### `access: "public"` vs `access: "secret"`
- `public` - może być widoczne w logach
- `secret` - ukryte w logach Astro

## Troubleshooting

### Build w GitHub Actions fail: "Missing environment variable"

**Rozwiązanie:** Dodaj zmienną do secrets i upewnij się że jest przekazana w `env:` w kroku buildu.

### Testy E2E fail: "401 Unauthorized"

**Rozwiązanie:** Sprawdź czy `.env.test` zawiera poprawne dane testowe.

### Cloudflare deployment fail: "Cannot connect to database"

**Rozwiązanie:** Dodaj zmienne środowiskowe w Cloudflare Dashboard.

## Best Practices

✅ **DO:**
- Używaj `import.meta.env` dla uniwersalności
- Trzymaj `optional: true` w schema dla kompatybilności
- Dodawaj wszystkie zmienne do `.env.example`
- Używaj różnych baz danych dla development/test/production

❌ **DON'T:**
- Nie commituj `.env` z prawdziwymi wartościami
- Nie używaj `process.env` w kodzie client-side (nie zadziała w przeglądarce)
- Nie używaj `import.meta.env` w plikach `.mjs` (tylko w `.ts`/`.tsx`/`.astro`)

