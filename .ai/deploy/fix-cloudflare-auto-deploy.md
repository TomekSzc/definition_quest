# Jak naprawić automatyczne deploymenty w Cloudflare Pages

## Kroki:

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. Przejdź do **Workers & Pages** → Wybierz swój projekt

3. Przejdź do zakładki **Settings** → **Builds & deployments**

4. Edytuj **Build configuration**:

### Production build settings:

```
Framework preset: None (lub Astro)
Build command: npm run build
Build output directory: /dist
Root directory: /
```

### Environment variables (Production):

```
NODE_VERSION: 22
SUPABASE_URL: <twój URL>
SUPABASE_KEY: <twój key>
OPENROUTER_API_KEY: <twój key>
ENV_NAME: prod
```

5. **WAŻNE**: Usuń lub pozostaw puste pole **"Deploy command"**
   - Cloudflare Pages automatycznie użyje odpowiedniej komendy dla Astro

## Jeśli nadal nie działa:

Dodaj plik `wrangler.toml` w root projektu:

```toml
name = "definition-quest"
compatibility_date = "2025-11-25"
pages_build_output_dir = "./dist"

[env.production]
compatibility_date = "2025-11-25"
```

## Porównanie opcji:

### GitHub Actions (Opcja 1 - ZALECANE)

✅ Pełna kontrola nad CI/CD
✅ Testy przed deploymentem (lint, unit tests)
✅ Możliwość manual approval
✅ Deployment summary w GitHub
✅ Rollback przez git revert
❌ Wymaga konfiguracji secrets w GitHub

### Cloudflare Auto-deploy (Opcja 2)

✅ Szybszy setup (mniej konfiguracji)
✅ Natywna integracja z Cloudflare
✅ Nie wymaga GitHub secrets dla API token
❌ Mniej kontroli nad procesem
❌ Brak testów przed deploymentem
❌ Trudniejszy rollback
