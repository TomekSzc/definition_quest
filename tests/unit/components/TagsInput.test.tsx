import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TagsInput from "@/components/ui/TagsInput";
import React from "react";

/**
 * Testy jednostkowe dla komponentu TagsInput
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Dodawanie tagów (Enter key)
 * - Usuwanie tagów (CloseIcon)
 * - Walidacja (max 10 tagów, whitespace, duplikaty)
 * - Wyświetlanie błędów walidacji
 * - Style warunkowe (error state)
 * - Accessibility (label, placeholder)
 * - Edge cases (długie tagi, pusty input, whitespace)
 */

// Mock dla Badge component
vi.mock("@/components/ui/Badge", () => ({
  Badge: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div data-testid="badge" className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock dla CloseIcon
interface MockCloseIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  onClick?: () => void;
}

vi.mock("@/assets/icons/CloseIcon", () => ({
  default: ({ className, onClick, ...props }: MockCloseIconProps) => (
    <svg data-testid="close-icon" className={className} onClick={onClick} {...props}>
      <path />
    </svg>
  ),
}));

describe("TagsInput", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować input z labelem", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Tagi (max 10)");
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe("LABEL");
      expect(input).toBeInTheDocument();
    });

    it("powinien mieć powiązanie label z inputem przez htmlFor", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Tagi (max 10)");
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(label).toHaveAttribute("for", "tags-input");
      expect(input).toHaveAttribute("id", "tags-input");
    });

    it("powinien renderować container dla tagów", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      const { container } = render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const tagsContainer = container.querySelector(".flex.flex-wrap.gap-2.mb-2");
      expect(tagsContainer).toBeInTheDocument();
    });

    it("powinien wyświetlić istniejące tagi z value prop", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const tags = ["JavaScript", "TypeScript", "React"];

      // Act
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Assert
      tags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });

    it("powinien renderować każdy tag jako Badge", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const tags = ["Tag1", "Tag2", "Tag3"];

      // Act
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Assert
      const badges = screen.getAllByTestId("badge");
      expect(badges).toHaveLength(3);
    });

    it("powinien renderować CloseIcon dla każdego tagu", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const tags = ["Tag1", "Tag2"];

      // Act
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Assert
      const closeIcons = screen.getAllByTestId("close-icon");
      expect(closeIcons).toHaveLength(2);
    });
  });

  describe("Dodawanie tagów", () => {
    it("powinien dodać tag po naciśnięciu Enter", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "NewTag{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["NewTag"]);
    });

    it("powinien wyczyścić input po dodaniu tagu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter") as HTMLInputElement;

      // Act
      await user.type(input, "TestTag{Enter}");

      // Assert
      expect(input.value).toBe("");
    });

    it("powinien dodać tag do istniejących tagów", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const existingTags = ["Tag1", "Tag2"];
      render(<TagsInput value={existingTags} onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "Tag3{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["Tag1", "Tag2", "Tag3"]);
    });

    it("powinien zablokować domyślne zachowanie Enter (submit form)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const mockSubmit = vi.fn();
      const user = userEvent.setup();

      // Act
      render(
        <form onSubmit={mockSubmit}>
          <TagsInput onChange={mockOnChange} />
        </form>
      );
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      await user.type(input, "TestTag{Enter}");

      // Assert
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("powinien przyciąć whitespace z tagu przed dodaniem (trimming)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "  TagWithSpaces  {Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["TagWithSpaces"]);
    });

    it("nie powinien dodać tagu składającego się tylko z whitespace", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "   {Enter}");

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("nie powinien dodać pustego tagu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "{Enter}");

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("nie powinien dodać duplikatu tagu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const existingTags = ["JavaScript"];
      render(<TagsInput value={existingTags} onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "JavaScript{Enter}");

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("nie powinien dodać tagu gdy już jest 10 tagów (max limit)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const maxTags = Array.from({ length: 10 }, (_, i) => `Tag${i + 1}`);
      render(<TagsInput value={maxTags} onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "Tag11{Enter}");

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien obsłużyć wielokrotne dodawanie tagów", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act - dodanie pierwszego tagu
      await user.type(input, "Tag1{Enter}");
      expect(mockOnChange).toHaveBeenNthCalledWith(1, ["Tag1"]);

      // Rerender z nowym value po dodaniu Tag1
      rerender(<TagsInput value={["Tag1"]} onChange={mockOnChange} />);
      await user.type(input, "Tag2{Enter}");
      expect(mockOnChange).toHaveBeenNthCalledWith(2, ["Tag1", "Tag2"]);

      // Rerender z nowym value po dodaniu Tag2
      rerender(<TagsInput value={["Tag1", "Tag2"]} onChange={mockOnChange} />);
      await user.type(input, "Tag3{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, ["Tag1", "Tag2", "Tag3"]);
    });
  });

  describe("Usuwanie tagów", () => {
    it("powinien usunąć tag po kliknięciu w CloseIcon", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const tags = ["Tag1", "Tag2", "Tag3"];
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Act
      const closeIcons = screen.getAllByTestId("close-icon");
      await user.click(closeIcons[1]); // Usuń Tag2

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["Tag1", "Tag3"]);
    });

    it("powinien usunąć pierwszy tag", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const tags = ["First", "Second", "Third"];
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Act
      const closeIcons = screen.getAllByTestId("close-icon");
      await user.click(closeIcons[0]);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["Second", "Third"]);
    });

    it("powinien usunąć ostatni tag", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const tags = ["First", "Second", "Third"];
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Act
      const closeIcons = screen.getAllByTestId("close-icon");
      await user.click(closeIcons[2]);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["First", "Second"]);
    });

    it("powinien usunąć wszystkie tagi pojedynczo", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const tags = ["Tag1", "Tag2"];
      const { rerender } = render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Act - usuń pierwszy tag
      let closeIcons = screen.getAllByTestId("close-icon");
      await user.click(closeIcons[0]);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, ["Tag2"]);

      // Rerender z zaktualizowanymi tagami
      rerender(<TagsInput value={["Tag2"]} onChange={mockOnChange} />);

      // Act - usuń drugi tag
      closeIcons = screen.getAllByTestId("close-icon");
      await user.click(closeIcons[0]);

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(2);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, []);
    });

    it("powinien mieć cursor-pointer na CloseIcon", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const tags = ["Tag1"];

      // Act
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Assert
      const closeIcon = screen.getByTestId("close-icon");
      expect(closeIcon).toHaveClass("cursor-pointer");
    });
  });

  describe("Wyświetlanie błędów", () => {
    it("powinien wyświetlić komunikat błędu gdy jest przekazany", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const errorMessage = "Maximum 10 tags allowed";

      // Act
      render(<TagsInput onChange={mockOnChange} error={errorMessage} />);

      // Assert
      const errorElement = screen.getByText(errorMessage);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.tagName).toBe("P");
    });

    it("nie powinien wyświetlać komunikatu błędu gdy error nie jest przekazany", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const errorElement = screen.queryByText(/error/i);
      expect(errorElement).not.toBeInTheDocument();
    });

    it("powinien zastosować style błędu (czerwone obramowanie) gdy jest error", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} error="Error message" />);

      // Assert
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(input).toHaveClass("border-red-500");
    });

    it("powinien zastosować style domyślne (primary border) gdy nie ma błędu", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(input).toHaveClass("border-[var(--color-primary)]");
      expect(input).not.toHaveClass("border-red-500");
    });

    it("powinien mieć właściwe style tekstu błędu", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} error="Error message" />);

      // Assert
      const errorElement = screen.getByText("Error message");
      expect(errorElement).toHaveClass("text-red-500");
      expect(errorElement).toHaveClass("text-xs");
      expect(errorElement).toHaveClass("mt-1");
    });
  });

  describe("Style komponentu", () => {
    it("powinien mieć wszystkie podstawowe klasy stylowania dla inputa", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("px-3");
      expect(input).toHaveClass("py-2");
      expect(input).toHaveClass("border");
      expect(input).toHaveClass("rounded");
      expect(input).toHaveClass("bg-background");
      expect(input).toHaveClass("text-foreground");
    });

    it("powinien mieć właściwe style dla labela", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Tagi (max 10)");
      expect(label).toHaveClass("block");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("font-bold");
      expect(label).toHaveClass("mb-1");
      expect(label).toHaveClass("text-[var(--color-primary)]");
    });

    it("powinien mieć właściwe style dla Badge", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const tags = ["Tag1"];

      // Act
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Assert
      const badge = screen.getByTestId("badge");
      expect(badge).toHaveClass("flex");
      expect(badge).toHaveClass("items-center");
      expect(badge).toHaveClass("gap-1");
      expect(badge).toHaveClass("bg-[var(--color-primary)]");
      expect(badge).toHaveClass("text-white");
    });

    it("powinien mieć właściwe style dla CloseIcon", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const tags = ["Tag1"];

      // Act
      render(<TagsInput value={tags} onChange={mockOnChange} />);

      // Assert
      const closeIcon = screen.getByTestId("close-icon");
      expect(closeIcon).toHaveClass("w-4");
      expect(closeIcon).toHaveClass("h-4");
      expect(closeIcon).toHaveClass("cursor-pointer");
      expect(closeIcon).toHaveClass("font-bold");
    });

    it("powinien mieć flex-wrap dla kontenera tagów", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      const { container } = render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const tagsContainer = container.querySelector(".flex.flex-wrap");
      expect(tagsContainer).toBeInTheDocument();
      expect(tagsContainer).toHaveClass("gap-2");
      expect(tagsContainer).toHaveClass("mb-2");
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć semantyczną strukturę label-input", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Tagi (max 10)");
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(label.tagName).toBe("LABEL");
      expect(input.tagName).toBe("INPUT");
    });

    it("powinien mieć opisowy placeholder", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      expect(input).toHaveAttribute("placeholder", "Dodaj tag i naciśnij Enter");
    });

    it("powinien wskazywać maksymalną liczbę tagów w labelu", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const label = screen.getByText("Tagi (max 10)");
      expect(label).toBeInTheDocument();
      expect(label.textContent).toContain("max 10");
    });

    it("powinien być dostępny z klawiatury (Enter key)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act - focus i dodanie tagu z klawiatury
      await user.click(input);
      expect(input).toHaveFocus();
      await user.type(input, "KeyboardTag{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith(["KeyboardTag"]);
    });
  });

  describe("Domyślne wartości props", () => {
    it("powinien obsłużyć brak value prop (domyślnie pusta tablica)", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      const { container } = render(<TagsInput onChange={mockOnChange} />);

      // Assert
      const badges = screen.queryAllByTestId("badge");
      expect(badges).toHaveLength(0);
      // Container powinien istnieć mimo braku tagów
      const tagsContainer = container.querySelector(".flex.flex-wrap");
      expect(tagsContainer).toBeInTheDocument();
    });

    it("powinien obsłużyć pustą tablicę jako value", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      render(<TagsInput value={[]} onChange={mockOnChange} />);

      // Assert
      const badges = screen.queryAllByTestId("badge");
      expect(badges).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć bardzo długi tag", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const longTag = "a".repeat(100);
      const { rerender } = render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, `${longTag}{Enter}`);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith([longTag]);

      // Rerender z dodanym tagiem aby sprawdzić czy się wyświetla
      rerender(<TagsInput value={[longTag]} onChange={mockOnChange} />);
      expect(screen.getByText(longTag)).toBeInTheDocument();
    });

    it("powinien obsłużyć tagi ze znakami specjalnymi", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const specialTag = "C++ / C#";
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, `${specialTag}{Enter}`);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith([specialTag]);
    });

    it("powinien obsłużyć tagi z emoji", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const emojiTag = "React ⚛️";
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, `${emojiTag}{Enter}`);

      // Assert
      expect(mockOnChange).toHaveBeenCalledWith([emojiTag]);
    });

    it("powinien obsłużyć pusty string jako error", () => {
      // Arrange
      const mockOnChange = vi.fn();

      // Act
      const { container } = render(<TagsInput onChange={mockOnChange} error="" />);

      // Assert
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      // Pusty error string nie powoduje wyświetlenia elementu <p> z błędem
      const errorParagraph = container.querySelector("p.text-red-500");
      expect(errorParagraph).not.toBeInTheDocument();
      // Style powinny być domyślne (bez czerwonego border)
      expect(input).toHaveClass("border-[var(--color-primary)]");
    });

    it("powinien obsłużyć dokładnie 10 tagów", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const maxTags = Array.from({ length: 10 }, (_, i) => `Tag${i + 1}`);

      // Act
      render(<TagsInput value={maxTags} onChange={mockOnChange} />);

      // Assert
      const badges = screen.getAllByTestId("badge");
      expect(badges).toHaveLength(10);
    });

    it("nie powinien pozwolić na dodanie 11. tagu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const maxTags = Array.from({ length: 10 }, (_, i) => `Tag${i + 1}`);
      render(<TagsInput value={maxTags} onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "Tag11{Enter}");

      // Assert
      expect(mockOnChange).not.toHaveBeenCalled();
      const badges = screen.getAllByTestId("badge");
      expect(badges).toHaveLength(10);
    });

    it("powinien obsłużyć case-sensitive duplikaty (JavaScript vs javascript)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const tags = ["JavaScript"];
      render(<TagsInput value={tags} onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act - próba dodania z małą literą
      await user.type(input, "javascript{Enter}");

      // Assert - powinien dodać, bo są różne (case-sensitive)
      expect(mockOnChange).toHaveBeenCalledWith(["JavaScript", "javascript"]);
    });

    it("powinien obsłużyć tag składający się z samych spacji i znaków specjalnych", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "   \t\n   {Enter}");

      // Assert - nie powinien dodać (whitespace zostanie przycięty)
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien obsłużyć szybkie wielokrotne Enter bez wpisywania tekstu", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.click(input);
      await user.keyboard("{Enter}{Enter}{Enter}");

      // Assert - nie powinien wywołać onChange dla pustych wartości
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("powinien obsłużyć zmianę value prop z zewnątrz", () => {
      // Arrange
      const mockOnChange = vi.fn();
      const initialTags = ["Tag1", "Tag2"];

      // Act - renderowanie z początkowymi tagami
      const { rerender } = render(<TagsInput value={initialTags} onChange={mockOnChange} />);
      expect(screen.getAllByTestId("badge")).toHaveLength(2);

      // Act - zmiana value z zewnątrz
      const updatedTags = ["Tag1", "Tag2", "Tag3", "Tag4"];
      rerender(<TagsInput value={updatedTags} onChange={mockOnChange} />);

      // Assert
      expect(screen.getAllByTestId("badge")).toHaveLength(4);
      expect(screen.getByText("Tag3")).toBeInTheDocument();
      expect(screen.getByText("Tag4")).toBeInTheDocument();
    });
  });

  describe("Integracja dodawania i usuwania", () => {
    it("powinien obsłużyć cykl: dodanie -> usunięcie -> dodanie", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act - dodanie tagu
      await user.type(input, "TestTag{Enter}");
      expect(mockOnChange).toHaveBeenNthCalledWith(1, ["TestTag"]);

      // Symulacja zmiany value po dodaniu
      rerender(<TagsInput value={["TestTag"]} onChange={mockOnChange} />);

      // Act - usunięcie tagu
      const closeIcon = screen.getByTestId("close-icon");
      await user.click(closeIcon);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, []);

      // Act - ponowne dodanie tagu
      rerender(<TagsInput value={[]} onChange={mockOnChange} />);
      const inputAgain = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");
      await user.type(inputAgain, "TestTag{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, ["TestTag"]);
    });

    it("powinien obsłużyć dodanie 10 tagów i próbę dodania 11.", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      const tags = Array.from({ length: 9 }, (_, i) => `Tag${i + 1}`);
      const { rerender } = render(<TagsInput value={tags} onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act - dodanie 10. tagu (powinno się udać)
      await user.type(input, "Tag10{Enter}");
      expect(mockOnChange).toHaveBeenCalledWith([...tags, "Tag10"]);

      // Symulacja zmiany value
      rerender(<TagsInput value={[...tags, "Tag10"]} onChange={mockOnChange} />);
      const inputAgain = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act - próba dodania 11. tagu (nie powinno się udać)
      await user.type(inputAgain, "Tag11{Enter}");

      // Assert
      expect(mockOnChange).toHaveBeenCalledTimes(1); // Tylko 10. tag został dodany
    });
  });

  describe("Interakcje klawiatury", () => {
    it("powinien reagować tylko na Enter (nie na inne klawisze)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter") as HTMLInputElement;

      // Act - wpisanie tekstu i inne klawisze (nie Enter)
      await user.type(input, "TestTag");

      // Assert - onChange nie powinien być wywołany po wpisaniu tekstu
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(input.value).toBe("TestTag");

      // Act - tylko Enter powinien dodać tag
      await user.keyboard("{Enter}");

      // Assert - tag został dodany
      expect(mockOnChange).toHaveBeenCalledWith(["TestTag"]);
      expect(input.value).toBe(""); // Input został wyczyszczony
    });

    it("powinien obsłużyć Enter key z modifiers (Shift+Enter)", async () => {
      // Arrange
      const mockOnChange = vi.fn();
      const user = userEvent.setup();
      render(<TagsInput onChange={mockOnChange} />);
      const input = screen.getByPlaceholderText("Dodaj tag i naciśnij Enter");

      // Act
      await user.type(input, "TestTag");
      await user.keyboard("{Shift>}{Enter}{/Shift}");

      // Assert - powinien dodać tag mimo Shift
      expect(mockOnChange).toHaveBeenCalledWith(["TestTag"]);
    });
  });
});
