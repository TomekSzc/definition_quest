import { test, expect } from "@playwright/test";
import { LoginPage, BoardsPage } from "../helpers/page-objects";

/**
 * Test suite dla scenariuszy logowania
 * Używa Page Object Model dla maintainable tests
 */
test.describe("Login Flow", () => {
  let loginPage: LoginPage;
  let boardsPage: BoardsPage;

  // Setup hook - wykonywany przed każdym testem
  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    boardsPage = new BoardsPage(page);

    // Przejdź do strony logowania
    await loginPage.goto();
  });

  test("should display login page correctly", async () => {
    // Verify - sprawdź czy strona logowania się wyświetla
    // Czekaj na formularz (już załadowany w beforeEach przez goto())
    await expect(loginPage.loginForm).toBeVisible({ timeout: 10000 });
    await loginPage.verifyPageTitle();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should login with valid credentials from environment variables", async ({ page }) => {
    // Arrange - sprawdź czy zmienne środowiskowe są ustawione
    const email = process.env.E2E_USERNAME;
    const password = process.env.E2E_PASSWORD;

    test.skip(!email || !password, "E2E_USERNAME and E2E_PASSWORD must be set");

    // Act - wykonaj logowanie
    await loginPage.loginWithEnvCredentials();

    // Assert - sprawdź czy nastąpiło przekierowanie (z większym timeoutem dla API)
    await loginPage.waitForSuccessfulLogin();

    // Sprawdź czy jesteśmy na stronie boards
    await expect(page).toHaveURL(/\/boards/, { timeout: 10000 });
    await expect(boardsPage.sidebar).toBeVisible({ timeout: 10000 });
  });

  test("should login with manually provided credentials", async ({ page }) => {
    // Arrange
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "password123";

    // Act - wypełnij pola krok po kroku
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.clickSubmit();

    // Assert - sprawdź przekierowanie
    await expect(page).toHaveURL(/\/boards/, { timeout: 10000 });
  });

  test("should toggle password visibility", async () => {
    // Arrange
    const testPassword = "MySecretPassword123";
    await loginPage.fillPassword(testPassword);

    // Act - kliknij i przytrzymaj ikonę oka (mousedown event)
    await loginPage.passwordToggle.dispatchEvent("mousedown");

    // Assert - sprawdź czy hasło jest widoczne (type="text")
    await expect(loginPage.passwordInput).toHaveAttribute("type", "text", { timeout: 3000 });

    // Act - puść ikonę
    await loginPage.passwordToggle.dispatchEvent("mouseup");

    // Assert - sprawdź czy hasło jest znowu ukryte (type="password")
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password", { timeout: 3000 });
  });

  test("should navigate to sign up page", async ({ page }) => {
    // Act
    await loginPage.goToSignUp();

    // Assert - czekaj na pełną nawigację
    await expect(page).toHaveURL(/\/signup/, { timeout: 10000 });
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // Act
    await loginPage.goToForgotPassword();

    // Assert - czekaj na pełną nawigację
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 10000 });
  });

  test("should have proper accessibility attributes", async () => {
    // Verify ARIA attributes and accessibility
    await expect(loginPage.emailInput).toHaveAttribute("type", "email");
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
    await expect(loginPage.submitButton).toHaveAttribute("type", "submit");
  });

  test("should display loading state on submit", async () => {
    // Arrange
    const testEmail = process.env.E2E_USERNAME || "test@example.com";
    const testPassword = process.env.E2E_PASSWORD || "password123";

    // Act
    await loginPage.fillEmail(testEmail);
    await loginPage.fillPassword(testPassword);
    await loginPage.clickSubmit();

    // Assert - przycisk powinien pokazać stan ładowania
    // (może być trudne do złapania, ale sprawdzamy czy przycisk jest disabled)
    const isDisabled = await loginPage.submitButton.isDisabled().catch(() => false);

    // Możemy też sprawdzić czy tekst zmienił się na "Logowanie..."
    const buttonText = await loginPage.submitButton.textContent();

    // W stanie ładowania przycisk może pokazywać "Logowanie..." lub być disabled
    expect(isDisabled || buttonText?.includes("Logowanie")).toBeTruthy();
  });
});
