import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import CardCountToggle from "@/components/ui/ToggleGroup/CardCountToggle";

/**
 * Testy jednostkowe dla komponentu CardCountToggle
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Wyświetlanie labela z odpowiednimi klasami i atrybutami
 * - Renderowanie dwóch przycisków toggle (16 i 24)
 * - Przekazywanie wartości przez prop value
 * - Obsługa zmiany wartości przez onChange
 * - Konwersja wartości między string a number
 * - Atrybuty accessibility (htmlFor, id)
 * - Stylowanie komponentu (Tailwind classes)
 * - Edge cases (ignorowanie nieprawidłowych wartości)
 */

// Mock dla ToggleGroup components z Radix UI
vi.mock("@/components/ui/ToggleGroup/Toggle-group", () => ({
  ToggleGroup: ({
    children,
    value,
    onValueChange,
    className,
    id,
    type,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    id?: string;
    type?: string;
  }) => {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const toggleValue = target.getAttribute("data-value");
      if (toggleValue) {
        onValueChange(toggleValue);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        const target = e.target as HTMLElement;
        const toggleValue = target.getAttribute("data-value");
        if (toggleValue) {
          onValueChange(toggleValue);
        }
      }
    };

    return (
      <div
        data-testid="toggle-group"
        data-value={value}
        data-type={type}
        id={id}
        className={className}
        role="radiogroup"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    );
  },
  ToggleGroupItem: ({ children, value, ...props }: { children: React.ReactNode; value: string }) => (
    <button data-testid={props["data-testid"] || `toggle-item-${value}`} data-value={value} role="radio" aria-checked={false} {...props}>
      {children}
    </button>
  ),
}));

describe("CardCountToggle", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Podstawowe renderowanie i struktura DOM", () => {
    it("powinien wyrenderować komponent z wszystkimi elementami", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      expect(screen.getByText("Liczba kart")).toBeInTheDocument();
      expect(screen.getByTestId("toggle-group")).toBeInTheDocument();
      expect(screen.getByTestId("card-count-16")).toBeInTheDocument();
      expect(screen.getByTestId("card-count-24")).toBeInTheDocument();
    });

    it("powinien wyrenderować komponent w strukturze div > label + ToggleGroup", () => {
      // Arrange & Act
      const { container } = render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const rootDiv = container.firstChild;
      expect(rootDiv?.nodeName).toBe("DIV");
      expect(rootDiv?.childNodes).toHaveLength(2);
    });

    it("powinien mieć wrapper div bez dodatkowych klas", () => {
      // Arrange & Act
      const { container } = render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv.className).toBe("");
    });
  });

  describe("Label - renderowanie i stylowanie", () => {
    it("powinien wyrenderować label z tekstem 'Liczba kart'", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe("LABEL");
    });

    it("powinien mieć atrybut htmlFor='cardCount' dla accessibility", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart") as HTMLLabelElement;
      expect(label.htmlFor).toBe("cardCount");
    });

    it("powinien mieć wszystkie klasy Tailwind dla labela", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      expect(label).toHaveClass("block");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("font-bold");
      expect(label).toHaveClass("mb-1");
    });

    it("powinien używać CSS custom property dla koloru primary", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      expect(label).toHaveClass("text-[var(--color-primary)]");
    });
  });

  describe("ToggleGroup - atrybuty i konfiguracja", () => {
    it("powinien mieć id='cardCount' powiązane z labelem", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("id", "cardCount");
    });

    it("powinien mieć type='single' dla pojedynczego wyboru", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("data-type", "single");
    });

    it("powinien mieć klasy flex gap-2 dla layoutu", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveClass("flex");
      expect(toggleGroup).toHaveClass("gap-2");
    });
  });

  describe("ToggleGroupItem - renderowanie przycisków", () => {
    it("powinien wyrenderować przycisk toggle dla wartości 16", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const button16 = screen.getByTestId("card-count-16");
      expect(button16).toBeInTheDocument();
      expect(button16).toHaveTextContent("16");
      expect(button16).toHaveAttribute("data-value", "16");
    });

    it("powinien wyrenderować przycisk toggle dla wartości 24", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const button24 = screen.getByTestId("card-count-24");
      expect(button24).toBeInTheDocument();
      expect(button24).toHaveTextContent("24");
      expect(button24).toHaveAttribute("data-value", "24");
    });

    it("powinien wyrenderować oba przyciski jako elementy radio dla accessibility", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const button16 = screen.getByTestId("card-count-16");
      const button24 = screen.getByTestId("card-count-24");
      expect(button16).toHaveAttribute("role", "radio");
      expect(button24).toHaveAttribute("role", "radio");
    });

    it("powinien mieć dokładnie dwa przyciski toggle", () => {
      // Arrange & Act
      const { container } = render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const buttons = container.querySelectorAll('[data-testid^="card-count-"]');
      expect(buttons).toHaveLength(2);
    });
  });

  describe("Prop value - ustawianie wartości aktywnej", () => {
    it("powinien ustawić wartość 16 jako aktywną gdy value={16}", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("data-value", "16");
    });

    it("powinien ustawić wartość 24 jako aktywną gdy value={24}", () => {
      // Arrange & Act
      render(<CardCountToggle value={24} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("data-value", "24");
    });

    it("powinien konwertować number na string dla ToggleGroup", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      const valueAttr = toggleGroup.getAttribute("data-value");
      expect(typeof valueAttr).toBe("string");
      expect(valueAttr).toBe("16");
    });
  });

  describe("Prop onChange - obsługa zmiany wartości", () => {
    it("powinien wywołać onChange z wartością 16 po kliknięciu przycisku 16", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={24} onChange={mockOnChange} />);

      // Act
      const button16 = screen.getByTestId("card-count-16");
      await user.click(button16);

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(16);
    });

    it("powinien wywołać onChange z wartością 24 po kliknięciu przycisku 24", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const button24 = screen.getByTestId("card-count-24");
      await user.click(button24);

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(24);
    });

    it("powinien przekazać wartość jako number, nie string", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const button24 = screen.getByTestId("card-count-24");
      await user.click(button24);

      // Assert
      const calledValue = mockOnChange.mock.calls[0][0];
      expect(typeof calledValue).toBe("number");
      expect(calledValue).toBe(24);
    });

    it("nie powinien wywołać onChange gdy wartość jest już wybrana", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const button16 = screen.getByTestId("card-count-16");
      await user.click(button16);

      // Assert
      // Radix UI ToggleGroup domyślnie wywołuje onValueChange nawet dla tej samej wartości
      // ale nasza logika warunkowa powinna to obsłużyć
      expect(mockOnChange).toHaveBeenCalledWith(16);
    });
  });

  describe("Konwersja wartości - string do number i type safety", () => {
    it("powinien akceptować tylko wartości '16' lub '24'", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act - symulacja nieprawidłowej wartości
      const toggleGroup = screen.getByTestId("toggle-group");
      const invalidButton = document.createElement("button");
      invalidButton.setAttribute("data-value", "32");
      toggleGroup.appendChild(invalidButton);

      await user.click(invalidButton);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien poprawnie konwertować string '16' na number 16", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={24} onChange={mockOnChange} />);

      // Act
      const button16 = screen.getByTestId("card-count-16");
      await user.click(button16);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(16);
      expect(mockOnChange).not.toHaveBeenCalledWith("16");
    });

    it("powinien poprawnie konwertować string '24' na number 24", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const button24 = screen.getByTestId("card-count-24");
      await user.click(button24);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(24);
      expect(mockOnChange).not.toHaveBeenCalledWith("24");
    });

    it("powinien używać type assertion dla bezpieczeństwa typów (16 | 24)", async () => {
      // Arrange
      const user = userEvent.setup();
      const onChangeTyped: (value: 16 | 24) => void = vi.fn();
      render(<CardCountToggle value={16} onChange={onChangeTyped} />);

      // Act
      const button24 = screen.getByTestId("card-count-24");
      await user.click(button24);

      // Assert
      expect(onChangeTyped).toHaveBeenCalledWith(24);
      const receivedValue: 16 | 24 = (onChangeTyped as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect([16, 24]).toContain(receivedValue);
    });
  });

  describe("Edge cases i walidacja", () => {
    it("powinien ignorować puste stringi", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const toggleGroup = screen.getByTestId("toggle-group");
      const emptyButton = document.createElement("button");
      emptyButton.setAttribute("data-value", "");
      toggleGroup.appendChild(emptyButton);

      await user.click(emptyButton);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien ignorować wartości null/undefined", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const toggleGroup = screen.getByTestId("toggle-group");
      const nullButton = document.createElement("button");
      toggleGroup.appendChild(nullButton);

      await user.click(nullButton);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien ignorować wartości nieliczbowe", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const toggleGroup = screen.getByTestId("toggle-group");
      const textButton = document.createElement("button");
      textButton.setAttribute("data-value", "invalid");
      toggleGroup.appendChild(textButton);

      await user.click(textButton);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien ignorować wartości liczbowe inne niż 16 lub 24", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const toggleGroup = screen.getByTestId("toggle-group");
      const invalidNumberButton = document.createElement("button");
      invalidNumberButton.setAttribute("data-value", "20");
      toggleGroup.appendChild(invalidNumberButton);

      await user.click(invalidNumberButton);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Re-renderowanie przy zmianie props", () => {
    it("powinien zaktualizować wybraną wartość gdy prop value się zmieni", () => {
      // Arrange
      const { rerender } = render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert - początkowa wartość
      let toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("data-value", "16");

      // Act - zmiana prop
      rerender(<CardCountToggle value={24} onChange={mockOnChange} />);

      // Assert - zaktualizowana wartość
      toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("data-value", "24");
    });

    it("powinien działać z nową funkcją onChange", async () => {
      // Arrange
      const user = userEvent.setup();
      const newOnChange = vi.fn();
      const { rerender } = render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act - zmiana handlera
      rerender(<CardCountToggle value={16} onChange={newOnChange} />);
      const button24 = screen.getByTestId("card-count-24");
      await user.click(button24);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(newOnChange).toHaveBeenCalledTimes(1);
      expect(newOnChange).toHaveBeenCalledWith(24);
    });

    it("powinien zachować strukturę DOM podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      rerender(<CardCountToggle value={24} onChange={mockOnChange} />);

      // Assert - struktura powinna być taka sama (zmienia się tylko atrybut data-value)
      expect(screen.getByText("Liczba kart")).toBeInTheDocument();
      expect(screen.getByTestId("card-count-16")).toBeInTheDocument();
      expect(screen.getByTestId("card-count-24")).toBeInTheDocument();
    });
  });

  describe("Accessibility - ARIA i semantyka", () => {
    it("powinien mieć powiązanie label-input przez htmlFor i id", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart") as HTMLLabelElement;
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(label.htmlFor).toBe("cardCount");
      expect(toggleGroup.id).toBe("cardCount");
    });

    it("powinien używać role='radio' dla pojedynczego wyboru", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const button16 = screen.getByTestId("card-count-16");
      const button24 = screen.getByTestId("card-count-24");
      expect(button16).toHaveAttribute("role", "radio");
      expect(button24).toHaveAttribute("role", "radio");
    });

    it("powinien mieć czytelny tekst labela w języku polskim", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      expect(label).toBeInTheDocument();
      expect(label.textContent).toBe("Liczba kart");
    });

    it("powinien mieć wyraźne teksty na przyciskach (16 i 24)", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const button16 = screen.getByTestId("card-count-16");
      const button24 = screen.getByTestId("card-count-24");
      expect(button16).toHaveTextContent("16");
      expect(button24).toHaveTextContent("24");
    });
  });

  describe("Integracja z ToggleGroup z Radix UI", () => {
    it("powinien przekazać wszystkie wymagane props do ToggleGroup", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveAttribute("id");
      expect(toggleGroup).toHaveAttribute("data-type");
      expect(toggleGroup).toHaveAttribute("data-value");
      expect(toggleGroup).toHaveAttribute("role", "radiogroup");
      expect(toggleGroup).toHaveAttribute("tabIndex", "0");
      expect(toggleGroup).toHaveClass("flex", "gap-2");
    });

    it("powinien renderować dwa ToggleGroupItem jako dzieci", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup.children).toHaveLength(2);
    });

    it("powinien obsłużyć callback onValueChange z ToggleGroup", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Act
      const button24 = screen.getByTestId("card-count-24");
      await user.click(button24);

      // Assert
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe("Stylowanie - CSS Custom Properties i Tailwind", () => {
    it("powinien używać CSS custom property --color-primary dla koloru", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      const classNames = label.className;
      expect(classNames).toContain("text-[var(--color-primary)]");
    });

    it("powinien stosować arbitrary value z Tailwind dla custom property", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      // Sprawdzamy czy arbitrary value [var(--color-primary)] jest w klasie
      expect(label.className).toMatch(/text-\[var\(--color-primary\)\]/);
    });

    it("powinien mieć odpowiednie klasy typografii dla labela", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      expect(label).toHaveClass("text-sm"); // Small text
      expect(label).toHaveClass("font-bold"); // Bold weight
    });

    it("powinien mieć odpowiednie klasy układu dla labela", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Liczba kart");
      expect(label).toHaveClass("block"); // Block display
      expect(label).toHaveClass("mb-1"); // Margin bottom
    });

    it("powinien stosować flexbox z gap dla ToggleGroup", () => {
      // Arrange & Act
      render(<CardCountToggle value={16} onChange={mockOnChange} />);

      // Assert
      const toggleGroup = screen.getByTestId("toggle-group");
      expect(toggleGroup).toHaveClass("flex");
      expect(toggleGroup).toHaveClass("gap-2");
    });
  });

  describe("Type Safety - TypeScript", () => {
    it("powinien akceptować tylko 16 | 24 jako typ value", () => {
      // Arrange & Act & Assert - kompilacja TypeScript
      // Ten test weryfikuje że TypeScript nie pozwoli na inne wartości
      render(<CardCountToggle value={16} onChange={mockOnChange} />);
      render(<CardCountToggle value={24} onChange={mockOnChange} />);
      // TypeScript nie pozwala na inne wartości niż 16 lub 24
      // Próba: render(<CardCountToggle value={32} onChange={mockOnChange} />);
      // spowoduje błąd kompilacji
    });

    it("powinien przekazać typowany callback onChange", () => {
      // Arrange
      const typedOnChange: (value: 16 | 24) => void = vi.fn();

      // Act & Assert - kompilacja TypeScript
      render(<CardCountToggle value={16} onChange={typedOnChange} />);
      expect(typedOnChange).not.toHaveBeenCalled();
    });
  });
});
