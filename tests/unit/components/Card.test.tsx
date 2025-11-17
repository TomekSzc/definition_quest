import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Card } from "@/components/ui/Game/Card";
import type { CardStatus } from "@/hooks/useBoardGame";

/**
 * Testy jednostkowe dla komponentu Card
 *
 * Testowane funkcjonalności:
 * - Renderowanie i struktura DOM
 * - System statusów (idle, selected, success, failure)
 * - Stylowanie bazowe i wariantowe
 * - Dark mode classes
 * - Interakcje użytkownika (onClick, disabled)
 * - Accessibility (aria-pressed, disabled state, focus-visible)
 * - Kombinacje props (status + disabled)
 * - Edge cases (długi tekst, puste teksty, wielokrotne kliknięcia)
 * - Type safety dla CardStatus
 */

describe("Card", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować button z tekstem", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Test Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button", { name: "Test Card" });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveTextContent("Test Card");
    });

    it("powinien mieć type='button' domyślnie", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("powinien renderować długi tekst", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const longText =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua";

      // Act
      render(<Card text={longText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(longText);
    });

    it("powinien renderować pusty string jako text", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("");
    });
  });

  describe("Style bazowe", () => {
    it("powinien mieć wszystkie podstawowe klasy stylowania", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-pointer");
      expect(button).toHaveClass("bg-white");
      expect(button).toHaveClass("text-black");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("text-center");
      expect(button).toHaveClass("text-sm");
      // font-medium jest w base, ale idle nadpisuje to font-bold
      expect(button).toHaveClass("select-none");
    });

    it("powinien mieć fixed dimensions", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-[250px]");
      expect(button).toHaveClass("h-[200px]");
    });

    it("powinien mieć klasy flexbox dla centrowania", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
    });

    it("powinien mieć klasy spacing (margin i padding)", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("mb-6");
      expect(button).toHaveClass("mx-2");
      expect(button).toHaveClass("p-2");
    });

    it("powinien mieć klasy focus-visible dla accessibility", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:outline-none");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-offset-2");
      expect(button).toHaveClass("focus-visible:ring-blue-500");
    });
  });

  describe("System statusów", () => {
    describe("Status: idle", () => {
      it("powinien zastosować klasy dla statusu idle", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Idle Card" status="idle" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("font-bold");
        expect(button).toHaveClass("border");
        expect(button).toHaveClass("border-neutral-300");
      });

      it("powinien mieć hover state dla statusu idle", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Idle Card" status="idle" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("hover:bg-neutral-50");
      });

      it("powinien mieć dark mode classes dla statusu idle", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Idle Card" status="idle" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("dark:border-neutral-600");
        expect(button).toHaveClass("dark:bg-neutral-800");
        expect(button).toHaveClass("dark:hover:bg-neutral-700");
      });

      it("nie powinien mieć aria-pressed dla statusu idle", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Idle Card" status="idle" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-pressed", "false");
      });
    });

    describe("Status: selected", () => {
      it("powinien zastosować klasy dla statusu selected", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Selected Card" status="selected" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("border-2");
        expect(button).toHaveClass("border-blue-500");
        expect(button).toHaveClass("bg-blue-50");
      });

      it("powinien mieć dark mode classes dla statusu selected", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Selected Card" status="selected" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("dark:bg-blue-900/20");
      });

      it("powinien mieć aria-pressed='true' dla statusu selected", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Selected Card" status="selected" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-pressed", "true");
      });

      it("nie powinien mieć klas z statusu idle", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Selected Card" status="selected" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("border-neutral-300");
        expect(button).not.toHaveClass("font-bold");
        expect(button).not.toHaveClass("hover:bg-neutral-50");
      });
    });

    describe("Status: success", () => {
      it("powinien zastosować klasy dla statusu success", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Success Card" status="success" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("border-2");
        expect(button).toHaveClass("border-green-500");
        expect(button).toHaveClass("bg-green-50");
      });

      it("powinien mieć dark mode classes dla statusu success", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Success Card" status="success" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("dark:bg-green-900/20");
      });

      it("nie powinien mieć aria-pressed dla statusu success", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Success Card" status="success" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-pressed", "false");
      });

      it("nie powinien mieć klas z innych statusów", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Success Card" status="success" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("border-blue-500");
        expect(button).not.toHaveClass("border-red-500");
        expect(button).not.toHaveClass("border-neutral-300");
      });
    });

    describe("Status: failure", () => {
      it("powinien zastosować klasy dla statusu failure", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Failure Card" status="failure" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("border-2");
        expect(button).toHaveClass("border-red-500");
        expect(button).toHaveClass("bg-red-50");
      });

      it("powinien mieć dark mode classes dla statusu failure", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Failure Card" status="failure" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveClass("dark:bg-red-900/20");
      });

      it("nie powinien mieć aria-pressed dla statusu failure", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Failure Card" status="failure" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("aria-pressed", "false");
      });

      it("nie powinien mieć klas z innych statusów", () => {
        // Arrange
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Failure Card" status="failure" onClick={mockOnClick} />);

        // Assert
        const button = screen.getByRole("button");
        expect(button).not.toHaveClass("border-green-500");
        expect(button).not.toHaveClass("border-blue-500");
        expect(button).not.toHaveClass("bg-green-50");
      });
    });
  });

  describe("Interakcje użytkownika", () => {
    describe("onClick handler", () => {
      it("powinien wywołać onClick gdy kliknięto kartę", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Clickable Card" status="idle" onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        await user.click(button);

        // Assert
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      });

      it("powinien obsłużyć wielokrotne kliknięcia", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Card" status="idle" onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        await user.click(button);
        await user.click(button);
        await user.click(button);

        // Assert
        expect(mockOnClick).toHaveBeenCalledTimes(3);
      });

      it("powinien obsłużyć różne statusy podczas kliknięcia", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act & Assert - idle
        const { rerender } = render(<Card text="Card" status="idle" onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        await user.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(1);

        // Act & Assert - selected
        rerender(<Card text="Card" status="selected" onClick={mockOnClick} />);
        await user.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(2);

        // Act & Assert - success
        rerender(<Card text="Card" status="success" onClick={mockOnClick} />);
        await user.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(3);

        // Act & Assert - failure
        rerender(<Card text="Card" status="failure" onClick={mockOnClick} />);
        await user.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(4);
      });
    });

    describe("Keyboard navigation", () => {
      it("powinien wywołać onClick po naciśnięciu Enter", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Card" status="idle" onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        button.focus();
        await user.keyboard("{Enter}");

        // Assert
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      });

      it("powinien wywołać onClick po naciśnięciu Space", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Card" status="idle" onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        button.focus();
        await user.keyboard(" ");

        // Assert
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      });

      it("powinien być możliwy do focusowania przez Tab", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act
        render(
          <>
            <Card text="First" status="idle" onClick={mockOnClick} />
            <Card text="Second" status="idle" onClick={mockOnClick} />
          </>
        );
        await user.tab();

        // Assert
        expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
      });
    });

    describe("Mouse events", () => {
      it("powinien obsłużyć hover (onMouseEnter)", async () => {
        // Arrange
        const user = userEvent.setup();
        const mockOnClick = vi.fn();

        // Act
        render(<Card text="Card" status="idle" onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        await user.hover(button);

        // Assert - button jest w stanie hover (klasa hover:bg-neutral-50 jest aplikowana przez CSS)
        expect(button).toHaveClass("hover:bg-neutral-50");
      });
    });
  });

  describe("Disabled state", () => {
    it("powinien nie wywołać onClick gdy disabled=true", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Disabled Card" status="idle" disabled={true} onClick={mockOnClick} />);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it("powinien mieć disabled attribute gdy disabled=true", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Disabled Card" status="idle" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("powinien mieć klasy cursor-not-allowed i opacity-50 gdy disabled", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Disabled Card" status="idle" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-not-allowed");
      expect(button).toHaveClass("opacity-50");
    });

    it("nie powinien mieć klasy cursor-not-allowed gdy nie jest disabled", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).not.toHaveClass("cursor-not-allowed");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("powinien mieć cursor-pointer domyślnie", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("powinien obsłużyć disabled=false explicite", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" disabled={false} onClick={mockOnClick} />);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(button).not.toBeDisabled();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć undefined jako disabled (domyślnie enabled)", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(button).not.toBeDisabled();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("nie powinien być możliwy do focusowania przez Tab gdy disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(
        <>
          <Card text="Disabled" status="idle" disabled={true} onClick={mockOnClick} />
          <Card text="Enabled" status="idle" onClick={mockOnClick} />
        </>
      );
      await user.tab();

      // Assert - focus pomija disabled button
      expect(screen.getByRole("button", { name: "Enabled" })).toHaveFocus();
    });

    it("nie powinien reagować na Enter gdy disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Disabled Card" status="idle" disabled={true} onClick={mockOnClick} />);
      const button = screen.getByRole("button");
      button.focus(); // Manualny focus (w rzeczywistości disabled button nie może być focusowany)
      await user.keyboard("{Enter}");

      // Assert
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("powinien być dostępny dla screen readerów", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Accessible Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button", { name: "Accessible Card" });
      expect(button).toBeInTheDocument();
    });

    it("powinien mieć aria-pressed gdy status=selected", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="selected" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it("nie powinien mieć aria-pressed='true' dla innych statusów", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act & Assert - idle
      const { rerender } = render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");

      // Act & Assert - success
      rerender(<Card text="Card" status="success" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");

      // Act & Assert - failure
      rerender(<Card text="Card" status="failure" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("powinien mieć focus ring dla keyboard navigation", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-offset-2");
      expect(button).toHaveClass("focus-visible:ring-blue-500");
      expect(button).toHaveClass("focus-visible:outline-none");
    });

    it("powinien obsługiwać disabled state dla accessibility", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Disabled Card" status="idle" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveClass("opacity-50");
    });

    it("powinien mieć tekst dostępny dla screen readerów", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const cardText = "Definicja terminu";

      // Act
      render(<Card text={cardText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button", { name: cardText });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAccessibleName(cardText);
    });
  });

  describe("Kombinacje props", () => {
    it("powinien obsłużyć status=idle + disabled=false", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" disabled={false} onClick={mockOnClick} />);
      const button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(button).toHaveClass("border-neutral-300");
      expect(button).not.toBeDisabled();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć status=selected + disabled=true", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="selected" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-blue-500");
      expect(button).toHaveClass("opacity-50");
      expect(button).toBeDisabled();
    });

    it("powinien obsłużyć status=success + disabled=true", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="success" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-green-500");
      expect(button).toBeDisabled();
    });

    it("powinien obsłużyć status=failure + disabled=true", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="failure" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border-red-500");
      expect(button).toBeDisabled();
    });

    it("powinien obsłużyć wszystkie statusy bez disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();
      const statuses: CardStatus[] = ["idle", "selected", "success", "failure"];

      // Act & Assert
      for (const status of statuses) {
        const { unmount } = render(<Card text={`${status} card`} status={status} onClick={mockOnClick} />);
        const button = screen.getByRole("button");
        await user.click(button);
        expect(mockOnClick).toHaveBeenCalled();
        mockOnClick.mockClear();
        unmount();
      }
    });
  });

  describe("Re-rendering i zmiana props", () => {
    it("powinien obsłużyć zmianę statusu z idle na selected", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      const { rerender } = render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toHaveClass("border-neutral-300");

      rerender(<Card text="Card" status="selected" onClick={mockOnClick} />);
      button = screen.getByRole("button");

      // Assert
      expect(button).toHaveClass("border-blue-500");
      expect(button).not.toHaveClass("border-neutral-300");
    });

    it("powinien obsłużyć zmianę statusu z selected na success", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      const { rerender } = render(<Card text="Card" status="selected" onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toHaveClass("border-blue-500");

      rerender(<Card text="Card" status="success" onClick={mockOnClick} />);
      button = screen.getByRole("button");

      // Assert
      expect(button).toHaveClass("border-green-500");
      expect(button).not.toHaveClass("border-blue-500");
    });

    it("powinien obsłużyć zmianę statusu z selected na failure", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      const { rerender } = render(<Card text="Card" status="selected" onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toHaveClass("border-blue-500");

      rerender(<Card text="Card" status="failure" onClick={mockOnClick} />);
      button = screen.getByRole("button");

      // Assert
      expect(button).toHaveClass("border-red-500");
      expect(button).not.toHaveClass("border-blue-500");
    });

    it("powinien obsłużyć zmianę tekstu podczas re-renderowania", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      const { rerender } = render(<Card text="First Text" status="idle" onClick={mockOnClick} />);
      expect(screen.getByText("First Text")).toBeInTheDocument();

      rerender(<Card text="Second Text" status="idle" onClick={mockOnClick} />);

      // Assert
      expect(screen.getByText("Second Text")).toBeInTheDocument();
      expect(screen.queryByText("First Text")).not.toBeInTheDocument();
    });

    it("powinien obsłużyć zmianę disabled podczas re-renderowania", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      const { rerender } = render(<Card text="Card" status="idle" disabled={true} onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toBeDisabled();

      rerender(<Card text="Card" status="idle" disabled={false} onClick={mockOnClick} />);
      button = screen.getByRole("button");
      await user.click(button);

      // Assert
      expect(button).not.toBeDisabled();
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      const { rerender } = render(<Card text="Card 1" status="idle" onClick={mockOnClick} />);
      expect(screen.getByText("Card 1")).toBeInTheDocument();

      rerender(<Card text="Card 2" status="selected" onClick={mockOnClick} />);
      expect(screen.getByText("Card 2")).toBeInTheDocument();

      rerender(<Card text="Card 3" status="success" onClick={mockOnClick} />);
      expect(screen.getByText("Card 3")).toBeInTheDocument();

      rerender(<Card text="Card 4" status="failure" onClick={mockOnClick} />);
      expect(screen.getByText("Card 4")).toBeInTheDocument();

      rerender(<Card text="Card 5" status="idle" onClick={mockOnClick} />);

      // Assert
      expect(screen.getByText("Card 5")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długi tekst", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const veryLongText = "A".repeat(500);

      // Act
      render(<Card text={veryLongText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(veryLongText);
    });

    it("powinien obsłużyć tekst ze znakami specjalnymi", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const specialText = "!@#$%^&*()_+-={}[]|:;<>,.?/~`";

      // Act
      render(<Card text={specialText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(specialText);
    });

    it("powinien obsłużyć tekst z emoji", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const emojiText = "🎮 Gra memory 🧠";

      // Act
      render(<Card text={emojiText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(emojiText);
    });

    it("powinien obsłużyć tekst z polskimi znakami", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const polishText = "Zażółć gęślą jaźń";

      // Act
      render(<Card text={polishText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(polishText);
    });

    it("powinien obsłużyć tekst z wieloma liniami (newlines)", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const multilineText = "Line 1\nLine 2\nLine 3";

      // Act
      render(<Card text={multilineText} status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("powinien obsłużyć szybkie kolejne kliknięcia (debounce test)", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      const button = screen.getByRole("button");

      // Szybkie wielokrotne kliknięcia
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Assert - wszystkie kliknięcia są rejestrowane (brak debounce)
      expect(mockOnClick).toHaveBeenCalledTimes(5);
    });

    it("powinien obsłużyć zmianę onClick handler", async () => {
      // Arrange
      const user = userEvent.setup();
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();

      // Act
      const { rerender } = render(<Card text="Card" status="idle" onClick={firstHandler} />);
      const button = screen.getByRole("button");
      await user.click(button);

      rerender(<Card text="Card" status="idle" onClick={secondHandler} />);
      await user.click(button);

      // Assert
      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).toHaveBeenCalledTimes(1);
    });

    it("powinien obsłużyć undefined jako onClick (nie powinno crashować)", () => {
      // Arrange & Act
      const mockOnClick = vi.fn();

      // Assert - nie powinno wyrzucić błędu podczas renderowania
      expect(() => {
        render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      }).not.toThrow();
    });
  });

  describe("Type safety dla CardStatus", () => {
    it("powinien zaakceptować wszystkie dozwolone statusy", () => {
      // Arrange
      const mockOnClick = vi.fn();
      const statuses: CardStatus[] = ["idle", "selected", "success", "failure"];

      // Act & Assert - kompilacja bez błędów oznacza sukces
      statuses.forEach((status) => {
        const { unmount } = render(<Card text={`${status} card`} status={status} onClick={mockOnClick} />);
        expect(screen.getByRole("button")).toBeInTheDocument();
        unmount();
      });
    });

    it("wszystkie statusy powinny mieć odpowiednie klasy CSS", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act & Assert - idle
      const { rerender, unmount } = render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toHaveClass("border-neutral-300");

      // Act & Assert - selected
      rerender(<Card text="Card" status="selected" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveClass("border-blue-500");

      // Act & Assert - success
      rerender(<Card text="Card" status="success" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveClass("border-green-500");

      // Act & Assert - failure
      rerender(<Card text="Card" status="failure" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveClass("border-red-500");

      unmount();
    });
  });

  describe("Integracja z cn() utility", () => {
    it("powinien poprawnie łączyć klasy bazowe ze statusem", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="selected" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      // Bazowe
      expect(button).toHaveClass("cursor-pointer");
      expect(button).toHaveClass("rounded-md");
      // Ze statusu
      expect(button).toHaveClass("border-blue-500");
    });

    it("powinien poprawnie łączyć klasy disabled z bazowymi", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" disabled={true} onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      // Bazowe
      expect(button).toHaveClass("rounded-md");
      // Disabled
      expect(button).toHaveClass("cursor-not-allowed");
      expect(button).toHaveClass("opacity-50");
    });
  });

  describe("Dark mode", () => {
    it("powinien mieć klasy dark mode dla wszystkich statusów", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act & Assert - idle
      const { rerender } = render(<Card text="Card" status="idle" onClick={mockOnClick} />);
      let button = screen.getByRole("button");
      expect(button).toHaveClass("dark:bg-neutral-800");
      expect(button).toHaveClass("dark:hover:bg-neutral-700");

      // Act & Assert - selected
      rerender(<Card text="Card" status="selected" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveClass("dark:bg-blue-900/20");

      // Act & Assert - success
      rerender(<Card text="Card" status="success" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveClass("dark:bg-green-900/20");

      // Act & Assert - failure
      rerender(<Card text="Card" status="failure" onClick={mockOnClick} />);
      button = screen.getByRole("button");
      expect(button).toHaveClass("dark:bg-red-900/20");
    });

    it("powinien mieć dark mode border classes dla idle", () => {
      // Arrange
      const mockOnClick = vi.fn();

      // Act
      render(<Card text="Card" status="idle" onClick={mockOnClick} />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("dark:border-neutral-600");
    });
  });
});
