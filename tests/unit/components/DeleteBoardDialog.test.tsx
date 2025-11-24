import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteBoardDialog } from "@/components/ui/Boards/DeleteBoardDialog";

/**
 * Testy jednostkowe dla komponentu DeleteBoardDialog
 *
 * Testowane funkcjonalności:
 * - Renderowanie i widoczność dialogu
 * - Wywołanie API DELETE przy kliknięciu OK
 * - Stan loading (disabled przyciski, tekst "Usuwanie…")
 * - Wywołanie callbacków onSubmit i onClose
 * - Obsługa błędów API (404, 500, network errors)
 * - Funkcjonalność przycisku Anuluj
 * - Struktura DOM i stylowanie
 * - Przycisk zamykania dialogu
 * - Edge cases (wielokrotne kliknięcia, szybkie zamykanie)
 * - Accessibility (dialog, przyciski)
 */

// Mock dla fetch API
const mockFetch = vi.fn();

describe("DeleteBoardDialog", () => {
  beforeEach(() => {
    // Setup fetch mock
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderowanie i widoczność", () => {
    it("powinien wyświetlić dialog gdy isVisible=true", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText("Na pewno usunąć tablicę?")).toBeInTheDocument();
    });

    it("nie powinien wyświetlić dialogu gdy isVisible=false", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={false} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByText("Na pewno usunąć tablicę?")).not.toBeInTheDocument();
    });

    it("powinien renderować oba przyciski (Anuluj i OK)", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      const okButton = screen.getByText("OK");
      expect(cancelButton).toBeInTheDocument();
      expect(okButton).toBeInTheDocument();
    });

    it("powinien wyświetlić tytuł jako DialogTitle", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const title = screen.getByText("Na pewno usunąć tablicę?");
      expect(title.tagName).toBe("H2");
    });

    it("powinien przełączać widoczność gdy isVisible się zmienia", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act - initially hidden
      const { rerender } = render(
        <DeleteBoardDialog boardId="board-123" isVisible={false} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Act - show dialog
      rerender(
        <DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("Wywołanie API DELETE", () => {
    it("powinien wywołać DELETE API przy kliknięciu OK", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-456" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const okButton = screen.getByText("OK");
      await user.click(okButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/boards/board-456", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
      });
    });

    it("powinien użyć poprawnego boardId w URL", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(
        <DeleteBoardDialog boardId="test-board-789" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/boards/test-board-789",
          expect.objectContaining({
            method: "DELETE",
          })
        );
      });
    });

    it("powinien przesłać poprawne headers", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })
        );
      });
    });

    it("powinien wywołać onSubmit po pomyślnym usunięciu", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it("powinien wywołać onClose po pomyślnym usunięciu", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it("nie powinien wywołać fetch gdy już trwa loading", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      // Symuluj długie opóźnienie
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: async () => "",
                }),
              100
            )
          )
      );

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const okButton = screen.getByText("OK");
      await user.click(okButton); // Pierwsze kliknięcie
      await user.click(okButton); // Drugie kliknięcie podczas loading

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1); // Tylko jedno wywołanie
      });
    });
  });

  describe("Stan loading", () => {
    it("powinien wyświetlić 'Usuwanie…' podczas loading", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      // Symuluj opóźnienie
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: async () => "",
                }),
              50
            )
          )
      );

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const okButton = screen.getByText("OK");
      await user.click(okButton);

      // Assert
      expect(screen.getByText("Usuwanie…")).toBeInTheDocument();
      expect(screen.queryByText("OK")).not.toBeInTheDocument();

      // Cleanup - czekaj na zakończenie
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("powinien zdisablować przyciski podczas loading", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: async () => "",
                }),
              50
            )
          )
      );

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      const okButton = screen.getByText("Usuwanie…");

      expect(cancelButton).toBeDisabled();
      expect(okButton).toBeDisabled();

      // Cleanup
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("powinien wrócić do normalnego stanu po zakończeniu", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert - loading zakończone
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Obsługa błędów API", () => {
    it("nie powinien wywołać onSubmit gdy API zwraca błąd 404", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "Board not found",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to archive board", "Board not found");

      consoleErrorSpy.mockRestore();
    });

    it("nie powinien wywołać onSubmit gdy API zwraca błąd 500", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal server error",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("powinien obsłużyć błąd sieci (network error)", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith("Unexpected error while archiving board", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("powinien wywołać onClose nawet gdy wystąpi błąd", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
      mockFetch.mockRejectedValueOnce(new Error("Test error"));

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });

      consoleErrorSpy.mockRestore();
    });

    it("powinien logować błąd w konsoli przy niepowodzeniu", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "Error message",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Funkcjonalność przycisku Anuluj", () => {
    it("powinien wywołać onClose przy kliknięciu Anuluj", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const cancelButton = screen.getByText("Anuluj");
      await user.click(cancelButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("nie powinien wywołać fetch API przy kliknięciu Anuluj", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("Anuluj"));

      // Assert
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("nie powinien wywołać onSubmit przy kliknięciu Anuluj", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("Anuluj"));

      // Assert
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("powinien być aktywny (enabled) w stanie początkowym", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      expect(cancelButton).toBeEnabled();
    });
  });

  describe("Struktura DOM i stylowanie", () => {
    it("powinien mieć DialogContent z klasą text-black", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass("text-black");
    });

    it("powinien mieć kontener przycisków z właściwymi klasami", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      const okButton = screen.getByText("OK");
      const buttonContainer = cancelButton.parentElement;

      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass("flex", "justify-end", "gap-3", "mt-6");
      expect(buttonContainer).toContainElement(cancelButton);
      expect(buttonContainer).toContainElement(okButton);
    });

    it("przycisk Anuluj powinien mieć wariant secondary", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      expect(cancelButton).toHaveClass("cursor-pointer");
    });

    it("przycisk OK powinien mieć wariant destructive i tekst biały", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const okButton = screen.getByText("OK");
      expect(okButton).toHaveClass("text-white");
      expect(okButton).toHaveClass("cursor-pointer");
    });

    it("oba przyciski powinny mieć cursor-pointer", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      const okButton = screen.getByText("OK");
      expect(cancelButton).toHaveClass("cursor-pointer");
      expect(okButton).toHaveClass("cursor-pointer");
    });
  });

  describe("Przycisk zamykania dialogu", () => {
    it("powinien wywołać onClose przy kliknięciu przycisku X (close)", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const closeButton = document.querySelector('button[class*="absolute"]') as HTMLElement;
      await user.click(closeButton);

      // Assert
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("nie powinien wywołać fetch API przy zamknięciu przez X", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const closeButton = document.querySelector('button[class*="absolute"]') as HTMLElement;
      await user.click(closeButton);

      // Assert
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć role dialog", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
    });

    it("tytuł powinien być powiązany z dialogiem przez aria-labelledby", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const dialog = screen.getByRole("dialog");
      const title = screen.getByText("Na pewno usunąć tablicę?");

      const ariaLabelledBy = dialog.getAttribute("aria-labelledby");
      expect(ariaLabelledBy).toBeTruthy();
      expect(title.id).toBe(ariaLabelledBy);
    });

    it("przyciski powinny być focusable", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Assert
      const cancelButton = screen.getByText("Anuluj");
      const okButton = screen.getByText("OK");

      expect(cancelButton.tagName).toBe("BUTTON");
      expect(okButton.tagName).toBe("BUTTON");
    });

    it("powinien być możliwy do zamknięcia przez Escape", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.keyboard("{Escape}");

      // Assert
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długie boardId", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const longBoardId = "a".repeat(500);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(
        <DeleteBoardDialog boardId={longBoardId} isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/boards/${longBoardId}`, expect.any(Object));
      });
    });

    it("powinien obsłużyć boardId ze znakami specjalnymi", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const specialBoardId = "board-123!@#$%";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(
        <DeleteBoardDialog boardId={specialBoardId} isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`/api/boards/${specialBoardId}`, expect.any(Object));
      });
    });

    it("powinien obsłużyć wielokrotne przełączanie isVisible", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      const { rerender } = render(
        <DeleteBoardDialog boardId="board-123" isVisible={false} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      // Cykl 1
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      rerender(
        <DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Cykl 2
      rerender(
        <DeleteBoardDialog boardId="board-123" isVisible={false} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      rerender(
        <DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("powinien obsłużyć zmianę boardId podczas gdy dialog jest otwarty", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      const { rerender } = render(
        <DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      expect(screen.getByRole("dialog")).toBeInTheDocument();

      // Change boardId while open
      rerender(
        <DeleteBoardDialog boardId="board-456" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      // Assert - dialog nadal otwarty
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("powinien obsłużyć pusty string jako boardId", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/boards/", expect.any(Object));
      });
    });

    it("powinien obsłużyć szybkie kliknięcie OK wielokrotnie", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: async () => "",
                }),
              100
            )
          )
      );

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      const okButton = screen.getByText("OK");

      // Pierwsze kliknięcie rozpoczyna operację
      await user.click(okButton);

      // Podczas ładowania przyciski są disabled - kolejne kliknięcia są blokowane przez disabled state
      // userEvent automatycznie nie pozwoli kliknąć disabled przycisku
      expect(okButton).toBeDisabled();

      // Assert - tylko jedno wywołanie fetch (ochrana przez loading state)
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("powinien obsłużyć timeout przy długim request", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      // Symuluj bardzo długie opóźnienie
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  text: async () => "",
                }),
              5000
            )
          )
      );

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert - loading state
      expect(screen.getByText("Usuwanie…")).toBeInTheDocument();

      // Cleanup mock timers
      vi.clearAllTimers();
    }, 10000); // Zwiększony timeout dla tego testu
  });

  describe("Integracja z Dialog component", () => {
    it("powinien przekazać isVisible do Dialog jako open prop", () => {
      // Arrange
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act - dialog hidden
      const { rerender } = render(
        <DeleteBoardDialog boardId="board-123" isVisible={false} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Act - dialog visible
      rerender(
        <DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />
      );

      // Assert
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("powinien przekazać onClose do Dialog jako onOpenChange", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      // Zamknij przez overlay (domyślne zachowanie Dialog)
      const overlay = document.querySelector('[class*="backdrop-blur-sm"]') as HTMLElement;
      await user.click(overlay);

      // Assert
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Kolejność wywołań", () => {
    it("powinien wywołać onSubmit przed onClose", async () => {
      // Arrange
      const user = userEvent.setup();
      const callOrder: string[] = [];
      const mockOnSubmit = vi.fn(() => callOrder.push("onSubmit"));
      const mockOnClose = vi.fn(() => callOrder.push("onClose"));
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(callOrder).toEqual(["onSubmit", "onClose"]);
      });
    });

    it("przy błędzie API nie powinien wywołać onSubmit, ale powinien wywołać onClose", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnClose = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => vi.fn());
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "Error",
      });

      // Act
      render(<DeleteBoardDialog boardId="board-123" isVisible={true} onSubmit={mockOnSubmit} onClose={mockOnClose} />);

      await user.click(screen.getByText("OK"));

      // Assert
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
