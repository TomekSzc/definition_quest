# ✅ Deployment Checklist - Wypełnij przed deploymentem

## 📝 Cloudflare Configuration

- [ ] **Cloudflare Account ID**

  ```
  Znajdź w URL: dash.cloudflare.com/{account_id}/pages
  Twoje Account ID: _______________________________
  ```

- [ ] **Cloudflare Project Name**

  ```
  Nazwa projektu w Cloudflare Pages
  Twój Project Name: _______________________________
  ```

- [ ] **Cloudflare API Token**
  ```
  Wygenerowany w: dash.cloudflare.com/profile/api-tokens
  Z uprawnieniami: Cloudflare Pages → Edit
  ✓ Token zapisany bezpiecznie
  ```

## 🔐 GitHub Secrets (do dodania)

Przejdź do: Settings → Secrets and variables → Actions

- [ ] `CLOUDFLARE_API_TOKEN` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `CLOUDFLARE_ACCOUNT_ID` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `CLOUDFLARE_PROJECT_NAME` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `SUPABASE_URL` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `SUPABASE_KEY` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `OPENROUTER_API_KEY` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***

## 🌍 Cloudflare Environment Variables

W Cloudflare Dashboard → Twój projekt → Settings → Environment variables (Production)

- [ ] `SUPABASE_URL` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `SUPABASE_KEY` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `OPENROUTER_API_KEY` = **\*\***\*\***\*\***\_\_\_**\*\***\*\***\*\***
- [ ] `ENV_NAME` = `prod`

## 🚀 Deployment Steps

- [ ] Wszystkie zmiany zacommitowane

  ```bash
  git status  # sprawdź czy wszystko jest zacommitowane
  ```

- [ ] Jesteś na branchu master

  ```bash
  git branch --show-current  # powinno pokazać "master"
  ```

- [ ] Push na master

  ```bash
  git push origin master
  ```

- [ ] Sprawdzono workflow w GitHub Actions

  ```
  URL: https://github.com/{owner}/{repo}/actions
  ```

- [ ] Deployment zakończony sukcesem

  ```
  ✓ Lint
  ✓ Unit tests
  ✓ Build
  ✓ Deploy
  ```

- [ ] Aplikacja działa na Cloudflare
  ```
  URL: https://___________________________.pages.dev
  ```

## 🧪 Post-Deployment Verification

- [ ] Strona główna ładuje się poprawnie
- [ ] Możesz się zalogować
- [ ] Możesz się zarejestrować
- [ ] API endpoints działają
- [ ] Nie ma błędów w konsoli przeglądarki
- [ ] Zmienne środowiskowe są poprawnie ustawione (sprawdź feature flags)

## 📊 Monitoring

- [ ] Sprawdzono logi w Cloudflare Dashboard
- [ ] Skonfigurowano alerty (opcjonalne)
- [ ] Dodano własną domenę (opcjonalne)

## ⚠️ W razie problemów

1. Sprawdź logi w GitHub Actions
2. Sprawdź logi w Cloudflare Dashboard → Deployments
3. Sprawdź czy wszystkie zmienne środowiskowe są ustawione
4. Sprawdź konsole przeglądarki pod kątem błędów JavaScript
5. Sprawdź Network tab w DevTools pod kątem błędów API

---

**Data pierwszego deployu**: **\*\***\_\_\_**\*\***
**URL produkcyjny**: **\*\***\_\_\_**\*\***
**Notatki**:

```

```
