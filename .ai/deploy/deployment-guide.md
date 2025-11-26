# 🚀 Przewodnik Deployment na Cloudflare Pages

## Krok 1: Utwórz projekt na Cloudflare Pages

### A. Przez Dashboard (zalecane dla pierwszego setupu)

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages** → **Create application** → **Pages**
3. Wybierz **Connect to Git** i połącz z GitHub
4. **NIE KONFIGURUJ automatycznego deployu** - będziemy używać GitHub Actions
5. Zanotuj:
   - **Project Name** (nazwa projektu w Cloudflare)
   - **Account ID** (widoczne w URL: `dash.cloudflare.com/{account_id}/pages`)

### B. Alternatywnie: Przez Wrangler CLI

```bash
npx wrangler pages project create definition-quest
```

## Krok 2: Utwórz Cloudflare API Token

1. Przejdź do [API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Kliknij **Create Token**
3. Użyj template **Edit Cloudflare Workers** lub stwórz Custom Token z uprawnieniami:
   - **Account** → **Cloudflare Pages** → **Edit**
4. Zapisz wygenerowany token (nie będzie ponownie widoczny!)

## Krok 3: Skonfiguruj GitHub Secrets

W repozytorium GitHub przejdź do:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Dodaj następujące secrets:

### Cloudflare Secrets
```
CLOUDFLARE_API_TOKEN=<token z Kroku 2>
CLOUDFLARE_ACCOUNT_ID=<twoje account ID>
CLOUDFLARE_PROJECT_NAME=<nazwa projektu, np. definition-quest>
```

### Application Secrets (produkcyjne wartości)
```
SUPABASE_URL=<URL twojej produkcyjnej bazy Supabase>
SUPABASE_KEY=<anon key z produkcyjnej bazy Supabase>
OPENROUTER_API_KEY=<twój klucz API OpenRouter>
```

## Krok 4: Skonfiguruj zmienne środowiskowe w Cloudflare Pages

1. W Cloudflare Dashboard → **Workers & Pages** → Twój projekt
2. Przejdź do zakładki **Settings** → **Environment variables**
3. Dodaj zmienne dla środowiska **Production**:

```
SUPABASE_URL=<URL produkcyjnej bazy>
SUPABASE_KEY=<anon key produkcyjnej bazy>
OPENROUTER_API_KEY=<klucz API OpenRouter>
ENV_NAME=prod
```

⚠️ **Ważne**: Ustaw `ENV_NAME=prod` dla środowiska produkcyjnego!

## Krok 5: Utwórz środowisko GitHub (opcjonalne, ale zalecane)

1. W repozytorium GitHub → **Settings** → **Environments**
2. Kliknij **New environment**
3. Nazwij je `production`
4. Możesz dodać:
   - Protection rules (np. wymagaj review przed deploymentem)
   - Required reviewers
   - Deployment branches (tylko `master`)

## Krok 6: Wypchnij zmiany na branch master

### Jeśli jesteś na innym branchu:

```bash
# Sprawdź aktualny branch
git branch --show-current

# Commituj wszystkie zmiany
git add .
git commit -m "feat: configure Cloudflare deployment"

# Przejdź na master i zmerguj
git checkout master
git merge <twój-branch>
git push origin master
```

### Jeśli jesteś już na master:

```bash
# Commituj wszystkie zmiany
git add .
git commit -m "feat: configure Cloudflare deployment"
git push origin master
```

## Krok 7: Monitoruj deployment

1. Przejdź do zakładki **Actions** w repozytorium GitHub
2. Znajdź workflow **Master - Deploy to Production**
3. Obserwuj poszczególne kroki:
   - ✅ Lint code
   - ✅ Unit tests
   - ✅ Build application
   - ✅ Deploy to Cloudflare Pages

## Krok 8: Weryfikacja

Po pomyślnym deploymencie:

1. Cloudflare automatycznie wygeneruje URL: `https://<project-name>.pages.dev`
2. Możesz też dodać własną domenę w **Settings** → **Custom domains**
3. Sprawdź logi w:
   - GitHub Actions (workflow logs)
   - Cloudflare Dashboard → Twój projekt → **Deployments**

## 🔧 Troubleshooting

### Błąd: "Invalid binding `SESSION`"

Jeśli widzisz ten błąd, musisz dodać binding w `wrangler.toml`:

```toml
# wrangler.toml
name = "definition-quest"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SESSION"
id = "your-kv-namespace-id"
```

Utwórz KV namespace:
```bash
npx wrangler kv:namespace create SESSION
```

### Błąd: Build failure

Sprawdź logi w GitHub Actions, aby zidentyfikować problem:
- Upewnij się, że wszystkie secrets są poprawnie ustawione
- Sprawdź czy zmienne środowiskowe są dostępne podczas buildu

### Deployment działa, ale aplikacja nie działa poprawnie

1. Sprawdź zmienne środowiskowe w Cloudflare Pages Settings
2. Upewnij się, że `ENV_NAME=prod` jest ustawione
3. Sprawdź logi w Cloudflare Dashboard → **Real-time logs**

## 📚 Dodatkowe zasoby

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 🎯 Następne kroki po deploymencie

1. Skonfiguruj własną domenę
2. Ustaw monitoring i alerty
3. Skonfiguruj Cloudflare Analytics
4. Dodaj Web Analytics do strony
5. Rozważ użycie Cloudflare Cache dla statycznych assetów

