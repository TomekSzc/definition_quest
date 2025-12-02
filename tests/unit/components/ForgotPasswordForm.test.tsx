import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/store/api/apiSlice";

// ----------------------
// Mocks
// ----------------------

// Dynamic mocks allow per-test customisation without re-mocking the module
let isLoadingMock = false;
let isSuccessMock = false;
const requestResetSpy = vi.fn();

// Mock the RTK Query forgot password mutation hook
vi.mock("@/store/api/apiSlice", () => {
  return {
    apiSlice: {
      reducerPath: "api",
      reducer: () => ({}),
      middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
    },
    useForgotPasswordMutation: () => {
      const requestReset = (data: unknown) => {
        requestResetSpy(data);
        /* mimic RTK Query `.unwrap()` helper */
        return {
          unwrap: () => Promise.resolve({ message: "Password reset email sent" }),
        } as const;
      };
      return [requestReset, { isLoading: isLoadingMock, isSuccess: isSuccessMock }] as const;
    },
  };
});

// ----------------------
// Imports *after* mocks
// ----------------------
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

/**
 * Helper that renders the component with sensible defaults and gives back
 * the userEvent instance so we can avoid the global singleton.
 */
const setup = () => {
  const user = userEvent.setup();

  // Create a minimal test store
  const testStore = configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  });

  render(
    <Provider store={testStore}>
      <ForgotPasswordForm />
    </Provider>
  );

  const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
  // Get submit button by type since text changes based on state
  const submitButton = screen.getByRole("button", { name: /wyślij link|wysyłanie/i }) as HTMLButtonElement;
  return { user, emailInput, submitButton };
};

// ----------------------
// Tests
// ----------------------

describe("<ForgotPasswordForm />", () => {
  beforeEach(() => {
    // Reset mocks between tests
    isLoadingMock = false;
    isSuccessMock = false;
    requestResetSpy.mockClear();
  });

  it("renders the form with email input and submit button", () => {
    setup();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wyślij link/i })).toBeInTheDocument();
  });

  it("submits valid email and calls the mutation with correct payload", async () => {
    // Arrange
    const { user, emailInput, submitButton } = setup();
    const testEmail = "test@example.com";

    // Act – fill and submit the form
    await user.type(emailInput, testEmail);
    await user.click(submitButton);

    // Assert – mutation invoked with correct payload
    await waitFor(() => {
      expect(requestResetSpy).toHaveBeenCalledWith({
        email: testEmail,
      });
    });

    expect(requestResetSpy).toHaveBeenCalledTimes(1);
  });

  it("shows validation error for invalid email format on blur", async () => {
    // Arrange
    const { user, emailInput } = setup();

    // Act – type invalid email and blur
    await user.type(emailInput, "invalid-email");
    await user.tab(); // trigger blur event

    // Assert – validation error appears
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it("does not show validation error when email field is empty on initial render", () => {
    setup();

    // Assert – no validation error on initial render
    expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
  });

  it("clears validation error when valid email is entered after invalid one", async () => {
    // Arrange
    const { user, emailInput } = setup();

    // Act – type invalid email and blur to trigger validation
    await user.type(emailInput, "invalid");
    await user.tab();

    // Assert – error appears
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    // Act – clear and type valid email
    await user.clear(emailInput);
    await user.type(emailInput, "valid@example.com");
    await user.tab();

    // Assert – error disappears
    await waitFor(() => {
      expect(screen.queryByText(/invalid email format/i)).not.toBeInTheDocument();
    });
  });

  it("disables email input and shows loading text while the mutation is in progress", () => {
    // Arrange – simulate loading state
    isLoadingMock = true;

    // Act
    const { emailInput, submitButton } = setup();

    // Assert – email input is disabled and button shows loading text
    expect(emailInput).toBeDisabled();
    expect(submitButton).toHaveTextContent(/wysyłanie\.\.\./i);
    // Note: Submit button is not explicitly disabled during loading, only the input is
  });

  it("disables email input and submit button after successful submission", () => {
    // Arrange – simulate success state
    isSuccessMock = true;

    // Act
    const { emailInput, submitButton } = setup();

    // Assert – inputs and button remain disabled
    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("keeps form disabled when both loading and success states are true", () => {
    // Arrange – simulate both loading and success (edge case)
    isLoadingMock = true;
    isSuccessMock = true;

    // Act
    const { emailInput, submitButton } = setup();

    // Assert – form remains disabled (both input and button are disabled when isSuccess is true)
    expect(emailInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it("does not submit the form when validation fails", async () => {
    // Arrange
    const { user, emailInput, submitButton } = setup();

    // Act – try to submit without entering email
    await user.click(submitButton);

    // Assert – mutation should not be called due to HTML5 validation
    expect(requestResetSpy).not.toHaveBeenCalled();

    // Act – enter invalid email format and try to submit
    await user.type(emailInput, "not-an-email");
    await user.click(submitButton);

    // Assert – mutation still should not be called (zod validation prevents submission)
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    expect(requestResetSpy).not.toHaveBeenCalled();
  });

  it("allows resubmission with different email after initial blur validation", async () => {
    // Arrange
    const { user, emailInput, submitButton } = setup();

    // Act – enter first email and submit
    await user.type(emailInput, "first@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(requestResetSpy).toHaveBeenCalledWith({ email: "first@example.com" });
    });

    requestResetSpy.mockClear();

    // Act – change email and submit again (while not in loading/success state)
    await user.clear(emailInput);
    await user.type(emailInput, "second@example.com");
    await user.click(submitButton);

    // Assert – mutation called with new email
    await waitFor(() => {
      expect(requestResetSpy).toHaveBeenCalledWith({ email: "second@example.com" });
    });
  });

  it("maintains form structure with proper styling classes", () => {
    setup();

    // Assert – form container has expected styling
    const formContainer = screen.getByLabelText(/email/i).closest("div.max-w-md");
    expect(formContainer).toBeInTheDocument();
    expect(formContainer).toHaveClass("max-w-md", "w-full", "mx-auto");
  });
});
