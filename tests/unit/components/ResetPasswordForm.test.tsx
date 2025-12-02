import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

// ----------------------
// Mocks
// ----------------------

// Dynamic mocks allow per-test customisation without re-mocking the module
let isLoadingMock = false;
const resetPasswordSpy = vi.fn();

// Mock the RTK Query reset password mutation hook
vi.mock("@/store/api/apiSlice", () => {
  return {
    useResetPasswordMutation: () => {
      const resetPassword = (payload: unknown) => {
        resetPasswordSpy(payload);
        /* mimic RTK Query `.unwrap()` helper */
        return {
          unwrap: () => Promise.resolve({ success: true }),
        } as const;
      };
      return [resetPassword, { isLoading: isLoadingMock }] as const;
    },
  };
});

// ----------------------
// Imports *after* mocks
// ----------------------
import ResetPasswordForm from "@/components/forms/ResetPasswordForm";

/**
 * Helper that renders the component with sensible defaults and gives back
 * the userEvent instance so we can avoid the global singleton.
 */
const setup = (accessToken = "mock-access-token", refreshToken = "mock-refresh-token") => {
  const user = userEvent.setup();

  render(<ResetPasswordForm accessToken={accessToken} refreshToken={refreshToken} />);

  const newPasswordInput = screen.getByLabelText(/nowe hasło/i) as HTMLInputElement;
  const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i) as HTMLInputElement;
  const submitButton = screen.getByRole("button", { name: /zmień hasło/i }) as HTMLButtonElement;

  return { user, newPasswordInput, confirmPasswordInput, submitButton };
};

// ----------------------
// Tests
// ----------------------

describe("<ResetPasswordForm />", () => {
  beforeEach(() => {
    // Reset mocks between tests
    isLoadingMock = false;
    resetPasswordSpy.mockClear();
  });

  it("renders the form with all required fields and submit button", () => {
    setup();

    expect(screen.getByLabelText(/nowe hasło/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/potwierdź hasło/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /zmień hasło/i })).toBeInTheDocument();
  });

  it("submits the form with valid passwords and correct payload", async () => {
    // Arrange
    const accessToken = "test-access-123";
    const refreshToken = "test-refresh-456";
    const newPassword = "securePassword123";

    const { user, newPasswordInput, confirmPasswordInput, submitButton } = setup(accessToken, refreshToken);

    // Act – fill and submit the form
    await user.type(newPasswordInput, newPassword);
    await user.type(confirmPasswordInput, newPassword);
    await user.click(submitButton);

    // Assert – mutation invoked with correct payload
    await waitFor(() => {
      expect(resetPasswordSpy).toHaveBeenCalledWith({
        accessToken,
        refreshToken,
        newPassword,
      });
    });
  });

  it("shows validation error when password is too short", async () => {
    // Arrange
    const { user, newPasswordInput, confirmPasswordInput } = setup();

    // Act – type short password and blur to trigger validation
    await user.type(newPasswordInput, "12345");
    await user.tab(); // blur to trigger onBlur validation

    // Assert – validation error appears
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Mutation should not be called
    expect(resetPasswordSpy).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    // Arrange
    const { user, newPasswordInput, confirmPasswordInput, submitButton } = setup();

    // Act – type different passwords
    await user.type(newPasswordInput, "password123");
    await user.type(confirmPasswordInput, "differentPassword");
    await user.click(submitButton);

    // Assert – validation error appears
    await waitFor(() => {
      expect(screen.getByText(/hasła muszą być identyczne/i)).toBeInTheDocument();
    });

    // Mutation should not be called
    expect(resetPasswordSpy).not.toHaveBeenCalled();
  });

  it("disables inputs and shows loading state while the mutation is in progress", () => {
    // Arrange
    isLoadingMock = true; // Make the hook pretend it's loading

    render(<ResetPasswordForm accessToken="mock-token" refreshToken="mock-refresh" />);

    const newPasswordInput = screen.getByLabelText(/nowe hasło/i) as HTMLInputElement;
    const confirmPasswordInput = screen.getByLabelText(/potwierdź hasło/i) as HTMLInputElement;
    const submitButton = screen.getByRole("button") as HTMLButtonElement;

    // Assert – all inputs disabled during loading
    expect(newPasswordInput).toBeDisabled();
    expect(confirmPasswordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();

    // Check loading text
    expect(submitButton).toHaveTextContent(/zapisywanie\.\.\./i);
  });

  it("validates both password length and match simultaneously", async () => {
    // Arrange
    const { user, newPasswordInput, confirmPasswordInput, submitButton } = setup();

    // Act – type short password in first field, different in second
    await user.type(newPasswordInput, "123");
    await user.type(confirmPasswordInput, "456");
    await user.click(submitButton);

    // Assert – should show both validation errors
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/hasła muszą być identyczne/i)).toBeInTheDocument();
    });

    // Mutation should not be called
    expect(resetPasswordSpy).not.toHaveBeenCalled();
  });

  it("accepts valid passwords with exactly 6 characters", async () => {
    // Arrange
    const validPassword = "pass12"; // exactly 6 chars
    const { user, newPasswordInput, confirmPasswordInput, submitButton } = setup();

    // Act – type valid minimum length password
    await user.type(newPasswordInput, validPassword);
    await user.type(confirmPasswordInput, validPassword);
    await user.click(submitButton);

    // Assert – mutation called successfully
    await waitFor(() => {
      expect(resetPasswordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          newPassword: validPassword,
        })
      );
    });
  });

  it("clears validation errors when correcting input", async () => {
    // Arrange
    const { user, newPasswordInput, confirmPasswordInput } = setup();

    // Act – first trigger an error
    await user.type(newPasswordInput, "123");
    await user.tab();

    // Assert – error appears
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Act – clear and type valid password
    await user.clear(newPasswordInput);
    await user.type(newPasswordInput, "validPassword123");
    await user.tab();

    // Assert – error should eventually clear (may take a moment with onBlur mode)
    await waitFor(() => {
      expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  });
});
