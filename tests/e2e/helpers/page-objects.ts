import { Page, Locator } from '@playwright/test';

/**
 * Przykładowy Page Object Model dla Playwright
 * Pomaga w utrzymaniu testów poprzez centralizację selektorów i akcji
 */

export class HomePage {
  readonly page: Page;
  readonly header: Locator;
  readonly mainContent: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.mainContent = page.locator('main');
  }

  async goto() {
    await this.page.goto('/');
  }

  async getTitle() {
    return await this.page.title();
  }
}

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async isErrorVisible() {
    return await this.errorMessage.isVisible();
  }
}

