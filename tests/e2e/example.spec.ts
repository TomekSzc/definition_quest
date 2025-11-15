import { test, expect } from '@playwright/test';

/**
 * Przykładowy test e2e dla Playwright
 * Umieść tutaj testy end-to-end sprawdzające flow użytkownika
 */

test.describe('Przykładowy test e2e', () => {
  test('powinien załadować stronę główną', async ({ page }) => {
    // Przejdź do strony głównej
    await page.goto('/');
    
    // Sprawdź czy strona się załadowała
    await expect(page).toHaveTitle(/Definition Quest/i);
  });

  test('powinien obsługiwać nawigację', async ({ page }) => {
    await page.goto('/');
    
    // Kliknij w link (dostosuj selektor do swojej aplikacji)
    // await page.click('a[href="/about"]');
    
    // Sprawdź czy URL się zmienił
    // await expect(page).toHaveURL(/.*about/);
  });

  test('powinien robić screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Zrób screenshot (użyj do visual regression testing)
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});

test.describe('Testowanie formularzy', () => {
  test('powinien wypełnić formularz', async ({ page }) => {
    await page.goto('/');
    
    // Przykład wypełniania formularza (dostosuj selektory)
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'password123');
    // await page.click('button[type="submit"]');
    
    // Sprawdź rezultat
    // await expect(page.locator('.success-message')).toBeVisible();
  });
});

test.describe('Browser Context - izolacja testów', () => {
  test('powinien używać browser context', async ({ browser }) => {
    // Utwórz nowy kontekst przeglądarki dla izolacji
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Custom User Agent',
    });
    
    const page = await context.newPage();
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Definition Quest/i);
    
    await context.close();
  });
});

