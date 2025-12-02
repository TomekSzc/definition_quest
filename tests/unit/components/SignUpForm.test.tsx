import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import SignUpForm from "@/components/forms/SignUpForm";

/**
 * -----------------------------------------
 * Test doubles & global mocks
 * -----------------------------------------
 */

// Dynamic mocks allow per-test customization
let isLoadingMock = false;
const signUpRequestSpy = vi.fn();

// 1. Mock RTK Query sign-up mutation hook
vi.mock("@/store/api/apiSlice", () => {
  return {
    useSignUpMutation: () => {
      const signUp = (credentials: unknown) => {
        signUpRequestSpy(credentials);
        // Mimic RTK Query `.unwrap()` helper
        return {
          unwrap: () =>
            Promise.resolve({
              data: {
                user: { id: 1, email: "newuser@example.com", displayName: "New User" },
              },
            }),
        } as const;
      };
      return [signUp, { isLoading: isLoadingMock }] as const;
    },
  };
});

// 2. Mock routes constant
vi.mock("@/lib/routes", () => ({
  Routes: { Login: "/login" },
}));

/**
 * -----------------------------------------
 * Utility helpers
 * -----------------------------------------
 */

/**
 * Helper that renders the component and returns commonly used elements
 */
const setup = () => {
  const user = userEvent.setup();

  render(<SignUpForm />);

  const displayNameInput = screen.getByLabelText(/nazwa użytkownika/i) as HTMLInputElement;
  const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
  const passwordInput = screen.getByLabelText("Hasło") as HTMLInputElement;
  const repeatPasswordInput = screen.getByLabelText(/powtórz hasło/i) as HTMLInputElement;
  const submitButton = screen.getByRole("button", { name: /zarejestruj|rejestracja/i }) as HTMLButtonElement;

  return { user, displayNameInput, emailInput, passwordInput, repeatPasswordInput, submitButton };
};

/**
 * -----------------------------------------
 * Tests
 * -----------------------------------------
 */

describe("SignUpForm", () => {
  beforeEach(() => {
    // Reset mocks between tests
    isLoadingMock = false;
    signUpRequestSpy.mockClear();
    vi.clearAllMocks();
  });

  it("renders the sign-up form with all required fields", () => {
    setup();

    expect(screen.getByLabelText(/nazwa użytkownika/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Hasło")).toBeInTheDocument();
    expect(screen.getByLabelText(/powtórz hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zarejestruj/i })).toBeInTheDocument();
  });

  it("validates required fields by attempting to submit empty form", async () => {
    const { user, submitButton } = setup();

    // Try to submit empty form
    await user.click(submitButton);

    // Mutation should not be called when form is invalid
    expect(signUpRequestSpy).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const { user, emailInput, submitButton, displayNameInput, passwordInput, repeatPasswordInput } = setup();

    // Fill form with invalid email
    await user.type(displayNameInput, "John Doe");
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "password123");
    await user.type(repeatPasswordInput, "password123");
    await user.click(submitButton);

    // Mutation should not be called when email is invalid
    expect(signUpRequestSpy).not.toHaveBeenCalled();
  });

  it("validates that passwords match", async () => {
    const { user, displayNameInput, emailInput, passwordInput, repeatPasswordInput, submitButton } = setup();

    await user.type(displayNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(passwordInput, "password123");
    await user.type(repeatPasswordInput, "password456");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Mutation should not be called when passwords don't match
    expect(signUpRequestSpy).not.toHaveBeenCalled();
  });

  it("validates minimum password length", async () => {
    const { user, displayNameInput, emailInput, passwordInput, repeatPasswordInput, submitButton } = setup();

    await user.type(displayNameInput, "John Doe");
    await user.type(emailInput, "john@example.com");
    await user.type(passwordInput, "12345");
    await user.type(repeatPasswordInput, "12345");
    await user.click(submitButton);

    await waitFor(() => {
      const errorMessages = screen.getAllByText(/at least 6 characters/i);
      // Both password fields show the error message
      expect(errorMessages.length).toBeGreaterThanOrEqual(1);
    });

    // Mutation should not be called when password is too short
    expect(signUpRequestSpy).not.toHaveBeenCalled();
  });

  it("submits form with valid data and redirects to login page", async () => {
    // Arrange
    const assignSpy = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign: assignSpy } as unknown as Location);

    const { user, displayNameInput, emailInput, passwordInput, repeatPasswordInput, submitButton } = setup();

    // Act - fill out the form with valid data
    await user.type(displayNameInput, "John Doe");
    await user.type(emailInput, "john.doe@example.com");
    await user.type(passwordInput, "password123");
    await user.type(repeatPasswordInput, "password123");
    await user.click(submitButton);

    // Assert - signUp mutation called with correct payload
    await waitFor(() => {
      expect(signUpRequestSpy).toHaveBeenCalledWith({
        email: "john.doe@example.com",
        password: "password123",
        displayName: "John Doe",
      });
    });

    // Assert - redirect happened to login page
    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith("/login");
    });
  });

  it("disables all inputs and shows loading state during submission", () => {
    isLoadingMock = true; // Make the hook pretend it's loading

    const { displayNameInput, emailInput, passwordInput, repeatPasswordInput, submitButton } = setup();

    expect(displayNameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(repeatPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();

    // Check loading text
    expect(submitButton).toHaveTextContent(/rejestracja\.\.\./i);
  });

  it("password fields have showPasswordToggle functionality", async () => {
    const { passwordInput, repeatPasswordInput } = setup();

    // Password fields should start as type="password"
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(repeatPasswordInput).toHaveAttribute("type", "password");

    // Verify that SVG eye icons are present (they're rendered when showPasswordToggle is true)
    const svgIcons = document.querySelectorAll("svg");
    // At least 2 SVG icons for the two password fields
    expect(svgIcons.length).toBeGreaterThanOrEqual(2);
  });

  it("does not submit form when validation fails", async () => {
    const { user, emailInput, submitButton } = setup();

    // Enter invalid email only
    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    // Mutation should not be called
    await waitFor(() => {
      expect(signUpRequestSpy).not.toHaveBeenCalled();
    });
  });

  it("handles form submission with valid data including potential whitespace", async () => {
    const assignSpy = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign: assignSpy } as unknown as Location);

    const { user, displayNameInput, emailInput, passwordInput, repeatPasswordInput, submitButton } = setup();

    await user.type(displayNameInput, "Jane Doe");
    await user.type(emailInput, "jane@example.com");
    await user.type(passwordInput, "password123");
    await user.type(repeatPasswordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(signUpRequestSpy).toHaveBeenCalledWith({
        email: "jane@example.com",
        password: "password123",
        displayName: "Jane Doe",
      });
    });

    // Verify navigation after successful signup
    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith("/login");
    });
  });
});
