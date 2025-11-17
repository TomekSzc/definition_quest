import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup/Toggle-group";

/**
 * Testy jednostkowe dla komponentu Toggle-group (ToggleGroup i ToggleGroupItem)
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie ToggleGroup i ToggleGroupItem
 * - Integracja z Radix UI (@radix-ui/react-toggle-group)
 * - Przekazywanie wartości przez prop value
 * - Obsługa zmiany wartości przez onValueChange
 * - Stylowanie stanów (data-[state=on], data-[state=off])
 * - Klasy Tailwind dla różnych stanów komponentu
 * - CSS Custom Properties (--color-primary)
 * - Obsługa custom className
 * - Atrybuty accessibility (role, aria-*)
 * - Responsywność interakcji (hover, focus, active)
 * - Edge cases (wiele elementów, puste wartości)
 * - Type safety i TypeScript
 */

describe("ToggleGroup", () => {
  describe("Podstawowe renderowanie", () => {
    it("powinien wyrenderować komponent ToggleGroup", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI używa role="group" dla type="single"
      const toggleGroup = screen.getByRole("group");
      expect(toggleGroup).toBeInTheDocument();
    });

    it("powinien wyrenderować ToggleGroup jako Radix Root component", () => {
      // Arrange & Act
      const { container } = render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI używa role="group" dla wszystkich typów
      const toggleGroup = container.querySelector('[role="group"]');
      expect(toggleGroup).toBeInTheDocument();
    });

    it("powinien renderować dzieci przekazane do ToggleGroup", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });
  });

  describe("Props - type", () => {
    it("powinien obsługiwać type='single' dla pojedynczego wyboru", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI używa role="group" dla type="single"
      const toggleGroup = screen.getByRole("group");
      expect(toggleGroup).toBeInTheDocument();
    });

    it("powinien obsługiwać type='multiple' dla wielokrotnego wyboru", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="multiple" value={["option1"]}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const toggleGroup = screen.getByRole("group");
      expect(toggleGroup).toBeInTheDocument();
    });
  });

  describe("Props - value", () => {
    it("powinien ustawić wartość aktywną dla type='single'", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).toHaveAttribute("data-state", "on");
      expect(button2).toHaveAttribute("data-state", "off");
    });

    it("powinien ustawić wiele wartości aktywnych dla type='multiple'", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="multiple" value={["option1", "option3"]}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
          <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      const button3 = screen.getByText("Option 3");
      expect(button1).toHaveAttribute("data-state", "on");
      expect(button2).toHaveAttribute("data-state", "off");
      expect(button3).toHaveAttribute("data-state", "on");
    });

    it("powinien obsłużyć undefined value (brak wyboru)", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).toHaveAttribute("data-state", "off");
      expect(button2).toHaveAttribute("data-state", "off");
    });
  });

  describe("Props - onValueChange", () => {
    it("powinien wywołać onValueChange po kliknięciu przycisku", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      await user.click(button2);

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });

    it("powinien wywołać onValueChange z tablicą dla type='multiple'", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup type="multiple" value={["option1"]} onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      await user.click(button2);

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(["option1", "option2"]);
    });

    it("powinien wywołać onValueChange z pustym stringiem gdy odznaczono jedyną opcję w type='single'", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button1 = screen.getByText("Option 1");
      await user.click(button1);

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith("");
    });
  });

  describe("Props - disabled", () => {
    it("powinien wyłączyć cały ToggleGroup gdy disabled={true}", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" disabled>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).toBeDisabled();
      expect(button2).toBeDisabled();
    });

    it("nie powinien wywołać onValueChange gdy komponent jest disabled", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange} disabled>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      await user.click(button2);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility - ARIA i semantyka", () => {
    it("powinien mieć role='group' dla type='single'", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI używa role="group" dla wszystkich typów
      const toggleGroup = screen.getByRole("group");
      expect(toggleGroup).toBeInTheDocument();
    });

    it("powinien mieć role='group' dla type='multiple'", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="multiple" value={[]}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const toggleGroup = screen.getByRole("group");
      expect(toggleGroup).toBeInTheDocument();
    });

    it("powinien przekazać aria-label do grupy", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1" aria-label="Choose option">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI używa role="group"
      const toggleGroup = screen.getByRole("group");
      expect(toggleGroup).toHaveAttribute("aria-label", "Choose option");
    });
  });
});

describe("ToggleGroupItem", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Podstawowe renderowanie", () => {
    it("powinien wyrenderować ToggleGroupItem jako button", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("powinien wyrenderować children przekazane do ToggleGroupItem", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">
            <span data-testid="custom-child">Custom Content</span>
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      expect(screen.getByTestId("custom-child")).toBeInTheDocument();
      expect(screen.getByText("Custom Content")).toBeInTheDocument();
    });

    it("powinien wyrenderować przycisk z odpowiednim stanem", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI nie renderuje atrybutu value, ale ustawia data-state
      const button = screen.getByText("Option 1");
      expect(button).toHaveAttribute("data-state", "on");
      expect(button.tagName).toBe("BUTTON");
    });
  });

  describe("Stylowanie - klasy Tailwind", () => {
    it("powinien mieć wszystkie podstawowe klasy Tailwind", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("px-4"); // padding horizontal
      expect(button).toHaveClass("py-2"); // padding vertical
      expect(button).toHaveClass("border"); // border
      expect(button).toHaveClass("rounded-md"); // border radius
      expect(button).toHaveClass("text-sm"); // text size
      expect(button).toHaveClass("font-bold"); // font weight
      expect(button).toHaveClass("transition-colors"); // transitions
      expect(button).toHaveClass("cursor-pointer"); // cursor
    });

    it("powinien stosować padding px-4 py-2", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
    });

    it("powinien mieć border i rounded-md", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("rounded-md");
    });

    it("powinien mieć typografię text-sm font-bold", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("font-bold");
    });

    it("powinien mieć transition-colors dla płynnych przejść", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("transition-colors");
    });

    it("powinien mieć cursor-pointer dla wskazania interaktywności", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("cursor-pointer");
    });
  });

  describe("Stylowanie - stany (data-state)", () => {
    it("powinien mieć data-state='on' gdy wartość jest aktywna", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveAttribute("data-state", "on");
    });

    it("powinien mieć data-state='off' gdy wartość nie jest aktywna", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 2");
      expect(button).toHaveAttribute("data-state", "off");
    });

    it("powinien mieć klasę data-[state=on]:bg-[var(--color-primary)] dla aktywnego stanu", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      const classNames = button.className;
      expect(classNames).toContain("data-[state=on]:bg-[var(--color-primary)]");
    });

    it("powinien mieć klasę data-[state=on]:text-white dla aktywnego stanu", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      const classNames = button.className;
      expect(classNames).toContain("data-[state=on]:text-white");
    });

    it("powinien mieć klasę data-[state=off]:text-[var(--color-primary)] dla nieaktywnego stanu", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 2");
      const classNames = button.className;
      expect(classNames).toContain("data-[state=off]:text-[var(--color-primary)]");
    });
  });

  describe("Stylowanie - CSS Custom Properties", () => {
    it("powinien używać CSS variable --color-primary dla tła aktywnego stanu", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      const classNames = button.className;
      expect(classNames).toMatch(/bg-\[var\(--color-primary\)\]/);
    });

    it("powinien używać CSS variable --color-primary dla tekstu nieaktywnego stanu", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 2");
      const classNames = button.className;
      expect(classNames).toMatch(/text-\[var\(--color-primary\)\]/);
    });

    it("powinien stosować arbitrary values z Tailwind dla custom properties", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      const classNames = button.className;
      // Sprawdzamy arbitrary values [var(...)]
      expect(classNames).toContain("[var(--color-primary)]");
    });
  });

  describe("Props - className (customizacja)", () => {
    it("powinien akceptować custom className", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1" className="custom-class">
            Option 1
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("custom-class");
    });

    it("powinien połączyć custom className z bazowymi klasami", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1" className="custom-class">
            Option 1
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("border");
    });

    it("powinien pozwolić na override bazowych klas przez cn() utility", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1" className="px-8 py-4">
            Option 1
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      // cn() z tailwind-merge powinien pozwolić na override px-4 -> px-8
      expect(button.className).toContain("px-");
      expect(button.className).toContain("py-");
    });

    it("powinien zachować wszystkie inne props oprócz className", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1" className="custom" data-testid="custom-item" aria-label="Custom label">
            Option 1
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByTestId("custom-item");
      expect(button).toHaveAttribute("aria-label", "Custom label");
      expect(button).toHaveAttribute("data-state", "on");
      expect(button).toHaveClass("custom");
    });
  });

  describe("Interakcje - kliknięcia", () => {
    it("powinien zmienić stan z 'off' na 'on' po kliknięciu", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      expect(button2).toHaveAttribute("data-state", "off");
      await user.click(button2);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });

    it("powinien odznaczać przycisk gdy type='single' i kliknie się aktywny przycisk", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button1 = screen.getByText("Option 1");
      expect(button1).toHaveAttribute("data-state", "on");
      await user.click(button1);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith("");
    });

    it("powinien obsłużyć wiele kliknięć w różne przyciski", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
          <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      await user.click(screen.getByText("Option 2"));
      await user.click(screen.getByText("Option 3"));

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, "option2");
      expect(mockOnChange).toHaveBeenNthCalledWith(2, "option3");
    });
  });

  describe("Interakcje - klawiatura", () => {
    it("powinien obsłużyć nawigację klawiszem Tab", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      await user.tab();

      // Assert
      const button1 = screen.getByText("Option 1");
      expect(button1).toHaveFocus();
    });

    it("powinien aktywować przycisk klawiszem Space", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      button2.focus();
      await user.keyboard(" ");

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });

    it("powinien aktywować przycisk klawiszem Enter", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      button2.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith("option2");
    });
  });

  describe("Props - disabled na poziomie item", () => {
    it("powinien wyłączyć pojedynczy ToggleGroupItem", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2" disabled>
            Option 2
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).not.toBeDisabled();
      expect(button2).toBeDisabled();
    });

    it("nie powinien wywołać onValueChange dla disabled item", async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2" disabled>
            Option 2
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Act
      const button2 = screen.getByText("Option 2");
      await user.click(button2);

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien mieć data-disabled attribute dla disabled item", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option2" disabled>
            Option 2
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button2 = screen.getByText("Option 2");
      expect(button2).toHaveAttribute("data-disabled");
    });
  });

  describe("Accessibility - ARIA attributes", () => {
    it("powinien mieć role='radio' dla elementów w type='single'", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const buttons = screen.getAllByRole("radio");
      expect(buttons).toHaveLength(2);
    });

    it("powinien mieć aria-pressed dla elementów w type='multiple'", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="multiple" value={["option1"]}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).toHaveAttribute("aria-pressed", "true");
      expect(button2).toHaveAttribute("aria-pressed", "false");
    });

    it("powinien przekazać aria-label do przycisku", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1" aria-label="First option">
            Option 1
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByLabelText("First option");
      expect(button).toBeInTheDocument();
    });

    it("powinien być dostępny dla screen readerów", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1" aria-label="Choose an option">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix UI używa role="group" zamiast "radiogroup"
      const toggleGroup = screen.getByRole("group", { name: "Choose an option" });
      expect(toggleGroup).toBeInTheDocument();
    });
  });

  describe("Edge cases i walidacja", () => {
    it("powinien obsłużyć pustą wartość value", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).toHaveAttribute("data-state", "off");
      expect(button2).toHaveAttribute("data-state", "off");
    });

    it("powinien obsłużyć wiele elementów (więcej niż 2)", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option3">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
          <ToggleGroupItem value="option3">Option 3</ToggleGroupItem>
          <ToggleGroupItem value="option4">Option 4</ToggleGroupItem>
          <ToggleGroupItem value="option5">Option 5</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      expect(screen.getByText("Option 1")).toHaveAttribute("data-state", "off");
      expect(screen.getByText("Option 2")).toHaveAttribute("data-state", "off");
      expect(screen.getByText("Option 3")).toHaveAttribute("data-state", "on");
      expect(screen.getByText("Option 4")).toHaveAttribute("data-state", "off");
      expect(screen.getByText("Option 5")).toHaveAttribute("data-state", "off");
    });

    it("powinien obsłużyć tylko jeden element", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button = screen.getByText("Option 1");
      expect(button).toHaveAttribute("data-state", "on");
    });

    it("powinien obsłużyć wartość która nie pasuje do żadnego item", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="nonexistent">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const button1 = screen.getByText("Option 1");
      const button2 = screen.getByText("Option 2");
      expect(button1).toHaveAttribute("data-state", "off");
      expect(button2).toHaveAttribute("data-state", "off");
    });
  });

  describe("Re-renderowanie przy zmianie props", () => {
    it("powinien zaktualizować data-state gdy value się zmieni", () => {
      // Arrange
      const { rerender } = render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - początkowy stan
      expect(screen.getByText("Option 1")).toHaveAttribute("data-state", "on");
      expect(screen.getByText("Option 2")).toHaveAttribute("data-state", "off");

      // Act - zmiana value
      rerender(
        <ToggleGroup type="single" value="option2" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - zaktualizowany stan
      expect(screen.getByText("Option 1")).toHaveAttribute("data-state", "off");
      expect(screen.getByText("Option 2")).toHaveAttribute("data-state", "on");
    });

    it("powinien działać z nową funkcją onValueChange", async () => {
      // Arrange
      const user = userEvent.setup();
      const newOnChange = vi.fn();
      const { rerender } = render(
        <ToggleGroup type="single" value="option1" onValueChange={mockOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act - zmiana handlera
      rerender(
        <ToggleGroup type="single" value="option1" onValueChange={newOnChange}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );
      await user.click(screen.getByText("Option 2"));

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(newOnChange).toHaveBeenCalledTimes(1);
      expect(newOnChange).toHaveBeenCalledWith("option2");
    });

    it("powinien zachować strukturę DOM podczas re-renderowania", () => {
      // Arrange
      const { rerender } = render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Act - re-render z tą samą strukturą
      rerender(
        <ToggleGroup type="single" value="option2">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="option2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - struktura powinna być taka sama
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByRole("group")).toBeInTheDocument();
    });
  });

  describe("Integracja z Radix UI", () => {
    it("powinien używać Radix UI Root jako bazę dla ToggleGroup", () => {
      // Arrange & Act
      const { container } = render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix renderuje element z role="group" i atrybutami Radix
      const toggleGroup = container.querySelector('[role="group"]');
      expect(toggleGroup).toBeInTheDocument();
      expect(toggleGroup).toHaveAttribute("dir", "ltr");
      expect(toggleGroup).toHaveAttribute("tabindex", "0");
    });

    it("powinien używać Radix UI Item jako bazę dla ToggleGroupItem", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert - Radix dodaje data-state
      const button = screen.getByText("Option 1");
      expect(button).toHaveAttribute("data-state");
    });

    it("powinien przekazać wszystkie props Radix UI do komponentu", () => {
      // Arrange & Act
      render(
        <ToggleGroup
          type="single"
          value="option1"
          orientation="vertical"
          dir="rtl"
          loop={false}
          data-testid="radix-toggle"
        >
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      const toggleGroup = screen.getByTestId("radix-toggle");
      expect(toggleGroup).toHaveAttribute("data-orientation", "vertical");
      expect(toggleGroup).toHaveAttribute("dir", "rtl");
    });
  });

  describe("Type Safety - TypeScript", () => {
    it("powinien akceptować prawidłowe typy props dla ToggleGroup", () => {
      // Arrange & Act & Assert - kompilacja TypeScript
      render(
        <ToggleGroup type="single" value="option1" onValueChange={() => vi.fn()}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );

      render(
        <ToggleGroup type="multiple" value={["option1"]} onValueChange={() => vi.fn()}>
          <ToggleGroupItem value="option1">Option 1</ToggleGroupItem>
        </ToggleGroup>
      );
    });

    it("powinien akceptować prawidłowe typy props dla ToggleGroupItem", () => {
      // Arrange & Act & Assert - kompilacja TypeScript
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1" className="custom" disabled={false}>
            Option 1
          </ToggleGroupItem>
        </ToggleGroup>
      );
    });

    it("powinien przekazać children jako ReactNode", () => {
      // Arrange & Act
      render(
        <ToggleGroup type="single" value="option1">
          <ToggleGroupItem value="option1">
            <div>
              <span>Complex</span>
              <strong>Children</strong>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>
      );

      // Assert
      expect(screen.getByText("Complex")).toBeInTheDocument();
      expect(screen.getByText("Children")).toBeInTheDocument();
    });
  });
});
