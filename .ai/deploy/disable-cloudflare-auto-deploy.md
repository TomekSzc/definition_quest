# Jak wyłączyć automatyczne deploymenty w Cloudflare Pages

## Kroki:

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)

2. Przejdź do **Workers & Pages** → Wybierz swój projekt

3. Przejdź do zakładki **Settings**

4. Scroll down do sekcji **Builds & deployments**

5. Kliknij **Edit** przy **Production branch**

6. **USUŃ** lub **WYŁĄCZ** automatyczne deploymenty z brancha master:
   - Opcja A: Ustaw production branch na coś innego niż `master` (np. `production-disabled`)
   - Opcja B: Całkowicie usuń konfigurację GitHub integration

7. Zapisz zmiany

## Alternatywnie - przez API:

```bash
# Wyłącz automatyczne deploymenty
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/{account_id}/pages/projects/{project_name}" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "production_branch": null
  }'
```

## Weryfikacja:

Po wyłączeniu automatycznych deploymentów:

- Pushe na master NIE będą automatycznie triggerować buildu w Cloudflare
- Tylko GitHub Actions workflow będzie wykonywać deployment
- Masz pełną kontrolę nad procesem CI/CD

## Następny krok:

Po wyłączeniu automatycznych deploymentów, push na master znowu:

```bash
git push origin master
```

Tym razem uruchomi się TYLKO GitHub Actions workflow, który używa poprawnej komendy.
