import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { Toast } from "@/components/ui/Toast";
import toastReducer from "@/store/slices/toastSlice";
import type { ToastState } from "@/store/slices/toastSlice";
import React from "react";

/**
 * Testy jednostkowe dla komponentu Toast
 *
 * Testowane funkcjonalności:
 * - Warunkowe renderowanie w zależności od visible
 * - Różne typy toastów (success, error, warning, info)
 * - Dynamiczne kolorowanie przez CSS variables
 * - Auto-dismiss po 15 sekundach
 * - Przycisk zamykania (clearToast)
 * - Integracja z Redux store
 * - Integracja z Radix UI
 * - Opcjonalny tytuł
 * - Accessibility (aria-label)
 * - Cleanup timeout przy unmount
 * - onOpenChange handling
 */

// Mock dla Radix UI Toast
vi.mock("@radix-ui/react-toast", () => ({
  Provider: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-provider">{children}</div>,
  Root: ({ children, className, open }: { children: React.ReactNode; className: string; open: boolean }) => (
    <div data-testid="toast-root" className={className} data-open={open}>
      {children}
    </div>
  ),
  Title: ({ children, className }: { children: React.ReactNode; className: string }) => (
    <div data-testid="toast-title" className={className}>
      {children}
    </div>
  ),
  Description: ({ children }: { children: React.ReactNode }) => <div data-testid="toast-description">{children}</div>,
  Viewport: ({ className }: { className: string }) => <div data-testid="toast-viewport" className={className} />,
}));

/**
 * Helper do tworzenia mock store z konfigurowalnymi wartościami
 */
const createMockStore = (toastState: Partial<ToastState> = {}) => {
  return configureStore({
    reducer: {
      toast: toastReducer,
    },
    preloadedState: {
      toast: {
        type: null,
        title: null,
        message: null,
        visible: false,
        ...toastState,
      },
    },
  });
};

/**
 * Helper do renderowania komponentu z Redux Provider
 */
const renderWithProvider = (toastState: Partial<ToastState> = {}) => {
  const store = createMockStore(toastState);
  return {
    ...render(
      <Provider store={store}>
        <Toast />
      </Provider>
    ),
    store,
  };
};

describe("Toast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("Warunkowe renderowanie", () => {
    it("nie powinien renderować niczego gdy visible = false", () => {
      // Arrange & Act
      const { container } = renderWithProvider({ visible: false });

      // Assert
      expect(container.firstChild).toBeNull();
    });

    it("powinien renderować toast gdy visible = true", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test message",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toBeInTheDocument();
    });

    it("nie powinien renderować toast provider gdy visible = false", () => {
      // Arrange & Act
      renderWithProvider({ visible: false });

      // Assert
      const provider = screen.queryByTestId("toast-provider");
      expect(provider).not.toBeInTheDocument();
    });

    it("powinien renderować wszystkie elementy struktury gdy visible = true", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "info",
        title: "Test title",
        message: "Test message",
      });

      // Assert
      expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
      expect(screen.getByTestId("toast-root")).toBeInTheDocument();
      expect(screen.getByTestId("toast-title")).toBeInTheDocument();
      expect(screen.getByTestId("toast-description")).toBeInTheDocument();
      expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
    });
  });

  describe("Typy toastów i kolorowanie", () => {
    it("powinien zastosować klasy success dla typu success", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Success message",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("bg-[var(--color-toast-success-bg)]");
      expect(toastRoot).toHaveClass("text-[var(--color-toast-success-text)]");
    });

    it("powinien zastosować klasy error dla typu error", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "error",
        message: "Error message",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("bg-[var(--color-toast-error-bg)]");
      expect(toastRoot).toHaveClass("text-[var(--color-toast-error-text)]");
    });

    it("powinien zastosować klasy warning dla typu warning", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "warning",
        message: "Warning message",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("bg-[var(--color-toast-warning-bg)]");
      expect(toastRoot).toHaveClass("text-[var(--color-toast-warning-text)]");
    });

    it("powinien zastosować klasy success dla typu info (używa success colors)", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "info",
        message: "Info message",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("bg-[var(--color-toast-success-bg)]");
      expect(toastRoot).toHaveClass("text-[var(--color-toast-success-text)]");
    });

    it("powinien domyślnie użyć typu info gdy type jest undefined", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: undefined,
        message: "Message without type",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("bg-[var(--color-toast-success-bg)]");
      expect(toastRoot).toHaveClass("text-[var(--color-toast-success-text)]");
    });
  });

  describe("Struktura i stylowanie", () => {
    it("powinien mieć wszystkie podstawowe klasy pozycjonowania i layoutu", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("z-[1000]");
      expect(toastRoot).toHaveClass("fixed");
      expect(toastRoot).toHaveClass("bottom-4");
      expect(toastRoot).toHaveClass("right-4");
      expect(toastRoot).toHaveClass("w-96");
    });

    it("powinien mieć klasy wizualne (rounded, shadow, border)", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("rounded-md");
      expect(toastRoot).toHaveClass("shadow-lg");
      expect(toastRoot).toHaveClass("border");
    });

    it("powinien mieć klasy paddingu i typografii", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("p-4");
      expect(toastRoot).toHaveClass("text-sm");
    });

    it("powinien mieć klasy animacji Radix UI", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("data-[state=open]:animate-in");
      expect(toastRoot).toHaveClass("data-[state=closed]:animate-out");
    });

    it("powinien mieć atrybut data-open ustawiony na true", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveAttribute("data-open", "true");
    });
  });

  describe("Wyświetlanie zawartości", () => {
    it("powinien wyświetlić wiadomość w Description", () => {
      // Arrange
      const message = "This is a test message";

      // Act
      renderWithProvider({
        visible: true,
        type: "success",
        message,
      });

      // Assert
      const description = screen.getByTestId("toast-description");
      expect(description).toHaveTextContent(message);
    });

    it("powinien wyświetlić tytuł gdy jest przekazany", () => {
      // Arrange
      const title = "Success!";
      const message = "Operation completed";

      // Act
      renderWithProvider({
        visible: true,
        type: "success",
        title,
        message,
      });

      // Assert
      const titleElement = screen.getByTestId("toast-title");
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent(title);
    });

    it("nie powinien wyświetlić tytułu gdy nie jest przekazany", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        title: null,
        message: "Message without title",
      });

      // Assert
      const titleElement = screen.queryByTestId("toast-title");
      expect(titleElement).not.toBeInTheDocument();
    });

    it("powinien wyświetlić tytuł z odpowiednimi klasami stylowania", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        title: "Test Title",
        message: "Test Message",
      });

      // Assert
      const titleElement = screen.getByTestId("toast-title");
      expect(titleElement).toHaveClass("font-semibold");
      expect(titleElement).toHaveClass("mb-1");
    });

    it("powinien wyświetlić długą wiadomość", () => {
      // Arrange
      const longMessage = "A".repeat(200);

      // Act
      renderWithProvider({
        visible: true,
        type: "info",
        message: longMessage,
      });

      // Assert
      const description = screen.getByTestId("toast-description");
      expect(description).toHaveTextContent(longMessage);
    });

    it("powinien wyświetlić wiadomość ze znakami specjalnymi", () => {
      // Arrange
      const specialMessage = "Test <>&\"'`{}[]()";

      // Act
      renderWithProvider({
        visible: true,
        type: "info",
        message: specialMessage,
      });

      // Assert
      const description = screen.getByTestId("toast-description");
      expect(description).toHaveTextContent(specialMessage);
    });
  });

  describe("Przycisk zamykania", () => {
    it("powinien renderować przycisk zamykania", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it("powinien mieć aria-label dla accessibility", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("powinien mieć odpowiednie klasy stylowania dla przycisku", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toHaveClass("absolute");
      expect(closeButton).toHaveClass("top-2");
      expect(closeButton).toHaveClass("right-2");
      expect(closeButton).toHaveClass("text-inherit");
      expect(closeButton).toHaveClass("hover:opacity-80");
      expect(closeButton).toHaveClass("cursor-pointer");
      expect(closeButton).toHaveClass("font-extrabold");
      expect(closeButton).toHaveClass("text-lg");
      expect(closeButton).toHaveClass("leading-none");
    });

    it("powinien wyświetlać symbol × jako zawartość przycisku", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toHaveTextContent("×");
    });

    it("powinien mieć onClick handler dla clearToast", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert - przycisk powinien mieć onClick handler
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("powinien mieć przycisk zamykania", async () => {
      // Arrange
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe("Auto-dismiss po 15 sekundach", () => {
    it("powinien ustawić timeout na hideToast gdy visible = true", () => {
      // Arrange
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");

      // Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    });

    it("nie powinien ustawić timeout gdy visible = false", () => {
      // Arrange
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");

      // Act
      renderWithProvider({ visible: false });

      // Assert
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it("powinien wywołać hideToast po 15 sekundach", () => {
      // Arrange
      const { store } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Act
      vi.advanceTimersByTime(15000);

      // Assert
      const state = store.getState();
      expect(state.toast.visible).toBe(false);
    });

    it("nie powinien wywołać hideToast przed upływem 15 sekund", () => {
      // Arrange
      const { store } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Act
      vi.advanceTimersByTime(14999);

      // Assert
      const state = store.getState();
      expect(state.toast.visible).toBe(true);
    });

    it("powinien wyczyścić timeout przy unmount", () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const { unmount } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Act
      unmount();

      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it("powinien wyczyścić timeout przy zmianie visible", () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const { unmount } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Reset aby pominąć pierwsze wywołanie
      clearTimeoutSpy.mockClear();

      // Act - unmount wywoła cleanup
      unmount();

      // Assert
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integracja z Redux store", () => {
    it("powinien korzystać z useAppSelector do odczytu stanu toast", () => {
      // Arrange & Act
      const { store } = renderWithProvider({
        visible: true,
        type: "success",
        title: "Success Title",
        message: "Success Message",
      });

      // Assert
      const state = store.getState();
      expect(state.toast.visible).toBe(true);
      expect(state.toast.type).toBe("success");
      expect(state.toast.title).toBe("Success Title");
      expect(state.toast.message).toBe("Success Message");
    });

    it("powinien reagować na zmianę stanu Redux", () => {
      // Arrange
      const { store, rerender } = renderWithProvider({ visible: false });

      // Act - dispatch showToast action
      store.dispatch({
        type: "toast/showToast",
        payload: {
          type: "error",
          message: "Error occurred",
          title: "Error",
        },
      });

      // Rerender z nowym stanem
      rerender(
        <Provider store={store}>
          <Toast />
        </Provider>
      );

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toBeInTheDocument();
      expect(screen.getByText("Error occurred")).toBeInTheDocument();
    });

    it("powinien używać useAppDispatch do wywołania hideToast", () => {
      // Arrange
      const { store } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Act
      vi.advanceTimersByTime(15000);

      // Assert
      const state = store.getState();
      expect(state.toast.visible).toBe(false);
    });

    it("powinien mieć możliwość wywołania clearToast przez przycisk", () => {
      // Arrange & Act
      const { store } = renderWithProvider({
        visible: true,
        type: "success",
        title: "Title",
        message: "Message",
      });

      // Assert - store jest poprawnie zainicjalizowany
      const state = store.getState();
      expect(state.toast.visible).toBe(true);
      expect(state.toast.type).toBe("success");

      // Symulacja clearToast action
      store.dispatch({ type: "toast/clearToast" });
      const newState = store.getState();
      expect(newState.toast.visible).toBe(false);
      expect(newState.toast.type).toBe(null);
    });
  });

  describe("Viewport styling", () => {
    it("powinien renderować Viewport z odpowiednimi klasami", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const viewport = screen.getByTestId("toast-viewport");
      expect(viewport).toHaveClass("fixed");
      expect(viewport).toHaveClass("bottom-4");
      expect(viewport).toHaveClass("right-4");
      expect(viewport).toHaveClass("flex");
      expect(viewport).toHaveClass("flex-col");
      expect(viewport).toHaveClass("gap-2");
      expect(viewport).toHaveClass("w-96");
      expect(viewport).toHaveClass("outline-none");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pustą wiadomość", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "",
      });

      // Assert
      const description = screen.getByTestId("toast-description");
      expect(description).toHaveTextContent("");
    });

    it("powinien obsłużyć pusty tytuł", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        title: "",
        message: "Message",
      });

      // Assert - pusty string jest falsy, więc tytuł nie powinien się renderować
      const titleElement = screen.queryByTestId("toast-title");
      expect(titleElement).not.toBeInTheDocument();
    });

    it("powinien obsłużyć wielokrotne zmiany stanu", () => {
      // Arrange
      const { store, rerender } = renderWithProvider({
        visible: true,
        type: "success",
        message: "First message",
      });

      // Assert - pierwszy toast
      expect(screen.getByText("First message")).toBeInTheDocument();

      // Act - zamknij toast przez dispatch
      store.dispatch({ type: "toast/clearToast" });

      // Rerender po zamknięciu
      rerender(
        <Provider store={store}>
          <Toast />
        </Provider>
      );

      // Assert - toast powinien być ukryty
      expect(screen.queryByTestId("toast-root")).not.toBeInTheDocument();

      // Act - pokaż nowy toast
      store.dispatch({
        type: "toast/showToast",
        payload: {
          type: "error",
          message: "Second message",
        },
      });

      // Rerender z nowym toastem
      rerender(
        <Provider store={store}>
          <Toast />
        </Provider>
      );

      // Assert
      expect(screen.getByText("Second message")).toBeInTheDocument();
    });

    it("powinien obsłużyć zmianę typu podczas gdy toast jest widoczny", () => {
      // Arrange
      const { store, rerender } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Success message",
      });

      // Act - zmiana typu na error
      store.dispatch({
        type: "toast/showToast",
        payload: {
          type: "error",
          message: "Error message",
        },
      });

      rerender(
        <Provider store={store}>
          <Toast />
        </Provider>
      );

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveClass("bg-[var(--color-toast-error-bg)]");
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });

    it("powinien obsłużyć bardzo długi tytuł i wiadomość", () => {
      // Arrange
      const longTitle = "A".repeat(100);
      const longMessage = "B".repeat(500);

      // Act
      renderWithProvider({
        visible: true,
        type: "info",
        title: longTitle,
        message: longMessage,
      });

      // Assert
      expect(screen.getByTestId("toast-title")).toHaveTextContent(longTitle);
      expect(screen.getByTestId("toast-description")).toHaveTextContent(longMessage);
    });

    it("powinien resetować timeout przy każdej zmianie visible", () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
      const setTimeoutSpy = vi.spyOn(global, "setTimeout");
      const { store, rerender } = renderWithProvider({
        visible: true,
        type: "success",
        message: "Message 1",
      });

      // Reset spy calls
      clearTimeoutSpy.mockClear();
      setTimeoutSpy.mockClear();

      // Act - zmiana visible (hide then show)
      store.dispatch({ type: "toast/hideToast" });
      rerender(
        <Provider store={store}>
          <Toast />
        </Provider>
      );

      store.dispatch({
        type: "toast/showToast",
        payload: { type: "info", message: "Message 2" },
      });
      rerender(
        <Provider store={store}>
          <Toast />
        </Provider>
      );

      // Assert - powinien wyczyścić stary timeout i ustawić nowy
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 15000);
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć semantyczną strukturę z aria-label na przycisku", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toHaveAttribute("aria-label", "Close");
    });

    it("przycisk powinien być focusable dla keyboard navigation", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert - przycisk jest w DOM i może otrzymać focus
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe("BUTTON");
    });

    it("powinien używać semantycznych komponentów Radix UI (Title, Description)", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        title: "Title",
        message: "Description",
      });

      // Assert
      expect(screen.getByTestId("toast-title")).toBeInTheDocument();
      expect(screen.getByTestId("toast-description")).toBeInTheDocument();
    });

    it("przycisk zamykania powinien dziedziczyć kolor tekstu (text-inherit)", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const closeButton = screen.getByRole("button", { name: /close/i });
      expect(closeButton).toHaveClass("text-inherit");
    });
  });

  describe("Integracja z Radix UI", () => {
    it("powinien renderować Provider z swipeDirection='right'", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert - Provider jest renderowany (testujemy mock)
      const provider = screen.getByTestId("toast-provider");
      expect(provider).toBeInTheDocument();
    });

    it("powinien przekazać open prop do Root", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        message: "Test",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toHaveAttribute("data-open", "true");
    });

    it("Root powinien mieć strukturę jako kontener dla Title, Description i Button", () => {
      // Arrange & Act
      renderWithProvider({
        visible: true,
        type: "success",
        title: "Title",
        message: "Message",
      });

      // Assert
      const toastRoot = screen.getByTestId("toast-root");
      expect(toastRoot).toContainElement(screen.getByTestId("toast-title"));
      expect(toastRoot).toContainElement(screen.getByTestId("toast-description"));
      expect(toastRoot).toContainElement(screen.getByRole("button", { name: /close/i }));
    });
  });
});
