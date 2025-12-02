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
let queryParamsMock: { params: Record<string, string | undefined> } = { params: {} };
const loginRequestSpy = vi.fn();

// Mock the RTK Query login mutation hook
vi.mock("@/store/api/apiSlice", () => {
  return {
    apiSlice: {
      reducerPath: "api",
      reducer: () => ({}),
      middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
    },
    useLoginMutation: () => {
      const login = (credentials: unknown) => {
        loginRequestSpy(credentials);
        /* mimic RTK Query `.unwrap()` helper */
        return {
          unwrap: () =>
            Promise.resolve({
              data: {
                user: { id: 1, email: "mock@user.test" },
              },
            }),
        } as const;
      };
      return [login, { isLoading: isLoadingMock }] as const;
    },
  };
});

// Mock the query-param helper used inside the form
vi.mock("@/hooks/useQueryParams", () => {
  return {
    useQueryParams: () => queryParamsMock,
  };
});

// ----------------------
// Imports *after* mocks
// ----------------------
import AuthForm from "../AuthForm";
import { Routes } from "@/lib/routes";

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
      <AuthForm />
    </Provider>
  );

  const emailInput = screen.getByTestId("login-email-input") as HTMLInputElement;
  const passwordInput = screen.getByTestId("login-password-input") as HTMLInputElement;
  const submitButton = screen.getByTestId("login-submit-button") as HTMLButtonElement;
  return { user, emailInput, passwordInput, submitButton };
};

// ----------------------
// Tests
// ----------------------

describe("<AuthForm />", () => {
  beforeEach(() => {
    // Reset mocks between tests
    isLoadingMock = false;
    queryParamsMock = { params: {} };
    loginRequestSpy.mockClear();
  });

  it("renders the login form with all required fields and submit button", () => {
    setup();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-button")).toBeInTheDocument();
  });

  it("submits entered credentials and redirects to default route when successful", async () => {
    // Arrange
    const assignSpy = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign: assignSpy } as unknown as Location);

    const { user, emailInput, passwordInput, submitButton } = setup();

    // Act – fill and submit the form
    await user.type(emailInput, "john.doe@example.com");
    await user.type(passwordInput, "super-secret");
    await user.click(submitButton);

    // Assert – login invoked with correct payload
    expect(loginRequestSpy).toHaveBeenCalledWith({
      email: "john.doe@example.com",
      password: "super-secret",
    });

    // Assert – redirect happened to fallback route
    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(Routes.Boards);
    });
  });

  it("disables inputs and shows loading state while the mutation is in progress", () => {
    isLoadingMock = true; // Make the hook pretend it's loading

    const { emailInput, passwordInput, submitButton } = setup();

    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    // Optional: check loading text
    expect(submitButton).toHaveTextContent(/logowanie\.\.\./i);
  });
});
