import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/ui/SearchInput";

/**
 * Testy jednostkowe dla komponentu SearchInput
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i accessibility
 * - Inicjalizacja z wartością początkową
 * - Debounced onChange callback
 * - Czyszczenie pola wyszukiwania
 * - Warunkowe wyświetlanie przycisku clear
 */

describe("SearchInput", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować input z odpowiednimi atrybutami accessibility", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} />);

      // Assert
      const input = screen.getByRole("textbox", { name: /pole wyszukiwania/i });
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("placeholder", "Szukaj...");
    });

    it("powinien wyrenderować input bez przycisku clear gdy jest pusty", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} />);

      // Assert
      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("powinien ustawić wartość początkową jeśli została przekazana", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const initialValue = "test query";

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue={initialValue} />);

      // Assert
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe(initialValue);
    });
  });

  describe("Debounced onChange", () => {
    it("powinien wywołać onChange po upływie czasu debounce (300ms)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);
      const input = screen.getByRole("textbox");

      // Act - wpisujemy tekst używając userEvent
      await user.type(input, "t");

      // Assert - onChange NIE powinien być wywołany natychmiast
      expect(mockOnChange).not.toHaveBeenCalled();

      // Act - czekamy na debounce (300ms + margines)
      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      // Assert - powinien być wywołany z poprawną wartością
      expect(mockOnChange).toHaveBeenCalledWith("t");
    });

    it("powinien debounce wielokrotne wpisywanie tekstu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup({ delay: 50 }); // Szybkie wpisywanie
      render(<SearchInput onChange={mockOnChange} />);
      const input = screen.getByRole("textbox");

      // Act - szybkie wpisywanie tekstu
      await user.type(input, "test");

      // Assert - onChange NIE powinien być wywołany podczas wpisywania
      expect(mockOnChange).not.toHaveBeenCalled();

      // Act - czekamy na debounce
      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      // Assert - powinien być wywołany tylko raz z pełnym tekstem
      expect(mockOnChange).toHaveBeenCalledWith("test");
    });

    it("powinien anulować poprzednie wywołanie debounce przy nowym wpisie", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);
      const input = screen.getByRole("textbox");

      // Act - pierwsze wpisanie
      await user.type(input, "abc");

      // Act - szybko czyścimy i wpisujemy nowe (przed zakończeniem debounce)
      await user.clear(input);
      await user.type(input, "xyz");

      // Act - czekamy na debounce
      await waitFor(
        () => {
          expect(mockOnChange).toHaveBeenCalled();
        },
        { timeout: 500 }
      );

      // Assert - powinno być wywołane z ostatnią wartością
      expect(mockOnChange).toHaveBeenCalledWith("xyz");
      expect(mockOnChange).not.toHaveBeenCalledWith("abc");
    });
  });

  describe("Funkcjonalność czyszczenia (Clear button)", () => {
    it("powinien pokazać przycisk clear gdy initialValue jest niepusty", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);

      // Assert - przycisk clear jest widoczny dla initialValue
      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("powinien wyczyścić input po kliknięciu przycisku clear", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      // Assert - input ma wartość początkową
      expect(input.value).toBe("test");

      // Get clear button (powinien być widoczny dla initialValue)
      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });

      // Act - kliknięcie przycisku clear
      await user.click(clearButton);

      // Assert - input został wyczyszczony
      expect(input.value).toBe("");
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("powinien wywołać onChange z pustym stringiem po wyczyszczeniu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} initialValue="test query" />);

      // Get clear button
      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });

      // Act
      await user.click(clearButton);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith("");
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it("nie powinien pokazać przycisku clear gdy initialValue jest pusty", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue="" />);

      // Assert
      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("nie powinien pokazać przycisku clear gdy brak initialValue", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} />);

      // Assert
      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć odpowiednie role ARIA dla screen readerów", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} />);

      // Assert
      const input = screen.getByRole("textbox", { name: /pole wyszukiwania/i });
      expect(input).toHaveAttribute("aria-label", "Pole wyszukiwania");
    });

    it("przycisk clear powinien mieć opisową etykietę aria-label", () => {
      // Arrange
      const mockOnChange = vi.fn();
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);

      // Assert
      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toHaveAttribute("aria-label", "Wyczyść wyszukiwanie");
      expect(clearButton).toHaveAttribute("type", "button");
    });

    it("przycisk clear powinien być dostępny z klawiatury", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);

      // Act - kliknięcie enterem na przycisku (symulacja dostępu z klawiatury)
      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });
      clearButton.focus();
      expect(clearButton).toHaveFocus();

      await user.keyboard("{Enter}");

      // Assert
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Integracja z useRefValue hook", () => {
    it("powinien zainicjalizować wartość useRefValue dla initialValue", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue="test value" />);

      // Assert - przycisk clear jest widoczny (oznacza że useRefValue zainicjalizował wartość)
      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("powinien zachować ref value po czyszczeniu inputa", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;

      // Get clear button
      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });

      // Act - czyszczenie
      await user.click(clearButton);

      // Assert - wartość ref (input.value) została wyczyszczona
      expect(input.value).toBe("");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pusty string jako initialValue", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue="" />);

      // Assert
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
      expect(screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i })).not.toBeInTheDocument();
    });

    it("powinien wywołać onChange po wyczyszczeniu przycisku clear", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);

      // Get clear button
      const clearButton = screen.getByRole("button", { name: /wyczyść wyszukiwanie/i });

      // Act - pierwsze kliknięcie
      await user.click(clearButton);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("powinien obsłużyć bardzo długi initialValue", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const longText = "a".repeat(500);

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue={longText} />);

      // Assert - input zawiera długi tekst
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe(longText);

      // Assert - przycisk clear jest widoczny
      const clearButton = screen.queryByRole("button", { name: /wyczyść wyszukiwanie/i });
      expect(clearButton).toBeInTheDocument();
    });

    it("nie powinien wywołać onChange gdy initialValue jest ustawiony", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<SearchInput onChange={mockOnChange} initialValue="test" />);

      // Assert - onChange NIE powinien być wywołany przy inicjalizacji
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
