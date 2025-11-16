import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/ui/Footer";

/**
 * Testy jednostkowe dla komponentu Footer
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Dynamiczny leftPadding w zależności od stanu sidebara (collapsed/expanded)
 * - Przekazywanie dodatkowych klas CSS
 * - Integracja z useSidebar hook
 * - Style wizualne (background, shadow, text)
 * - Płynne animacje przy zmianie stanu sidebara
 * - Stała wysokość i fixed layout
 * - Zawartość tekstowa (copyright)
 */

// Mock dla useSidebar hook
vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: vi.fn(),
}));

import { useSidebar } from "@/hooks/useSidebar";

describe("Footer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować element footer z podstawowymi klasami", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer.tagName).toBe("FOOTER");
      expect(footer).toHaveClass("w-full");
      expect(footer).toHaveClass("h-[60px]");
    });

    it("powinien zawierać tekst 'Definition Quest 2025'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const copyrightText = screen.getByText("Definition Quest 2025");
      expect(copyrightText).toBeInTheDocument();
      expect(copyrightText.tagName).toBe("P");
    });

    it("powinien mieć poprawne style layout (flex, items-center, justify-center)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("items-center");
      expect(footer).toHaveClass("justify-center");
    });

    it("powinien mieć padding wewnętrzny px-6", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("px-6");
    });
  });

  describe("Style wizualne", () => {
    it("powinien mieć shadow-inner dla efektu cienia wewnętrznego", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("shadow-inner");
    });

    it("powinien mieć background z CSS custom property (bg-[var(--color-primary)])", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("bg-[var(--color-primary)]");
    });

    it("powinien mieć mały rozmiar czcionki (text-sm)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("text-sm");
    });

    it("powinien mieć jasny szary kolor tekstu dla copyright (text-gray-100)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const copyrightText = screen.getByText("Definition Quest 2025");
      expect(copyrightText).toHaveClass("text-gray-100");
    });
  });

  describe("Animacje i transitions", () => {
    it("powinien mieć transition-all duration-200 dla płynnych animacji", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("transition-all");
      expect(footer).toHaveClass("duration-200");
    });
  });

  describe("Dynamiczny leftPadding w zależności od stanu sidebara", () => {
    describe("Gdy sidebar jest rozwinięty (collapsed = false)", () => {
      it("powinien zastosować większy leftPadding (pl-72)", () => {
        // Arrange
        vi.mocked(useSidebar).mockReturnValue({
          collapsed: false,
          toggle: vi.fn(),
          set: vi.fn(),
        });

        // Act
        render(<Footer />);

        // Assert
        const footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("pl-72");
        expect(footer).not.toHaveClass("pl-20");
      });

      it("powinien wywołać useSidebar hook", () => {
        // Arrange
        const mockUseSidebar = vi.mocked(useSidebar);
        mockUseSidebar.mockReturnValue({
          collapsed: false,
          toggle: vi.fn(),
          set: vi.fn(),
        });

        // Act
        render(<Footer />);

        // Assert
        expect(mockUseSidebar).toHaveBeenCalled();
      });
    });

    describe("Gdy sidebar jest zwinięty (collapsed = true)", () => {
      it("powinien zastosować mniejszy leftPadding (pl-20)", () => {
        // Arrange
        vi.mocked(useSidebar).mockReturnValue({
          collapsed: true,
          toggle: vi.fn(),
          set: vi.fn(),
        });

        // Act
        render(<Footer />);

        // Assert
        const footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("pl-20");
        expect(footer).not.toHaveClass("pl-72");
      });

      it("powinien wywołać useSidebar hook", () => {
        // Arrange
        const mockUseSidebar = vi.mocked(useSidebar);
        mockUseSidebar.mockReturnValue({
          collapsed: true,
          toggle: vi.fn(),
          set: vi.fn(),
        });

        // Act
        render(<Footer />);

        // Assert
        expect(mockUseSidebar).toHaveBeenCalled();
      });
    });

    describe("Zmiana stanu sidebara", () => {
      it("powinien zaktualizować padding po zmianie collapsed z false na true", () => {
        // Arrange
        const mockUseSidebar = vi.mocked(useSidebar);
        mockUseSidebar.mockReturnValue({
          collapsed: false,
          toggle: vi.fn(),
          set: vi.fn(),
        });

        // Act - początkowy render z collapsed = false
        const { rerender } = render(<Footer />);
        let footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("pl-72");

        // Symulacja zmiany stanu sidebara
        mockUseSidebar.mockReturnValue({
          collapsed: true,
          toggle: vi.fn(),
          set: vi.fn(),
        });
        rerender(<Footer />);

        // Assert - padding zmieniony na pl-20
        footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("pl-20");
        expect(footer).not.toHaveClass("pl-72");
      });

      it("powinien zaktualizować padding po zmianie collapsed z true na false", () => {
        // Arrange
        const mockUseSidebar = vi.mocked(useSidebar);
        mockUseSidebar.mockReturnValue({
          collapsed: true,
          toggle: vi.fn(),
          set: vi.fn(),
        });

        // Act - początkowy render z collapsed = true
        const { rerender } = render(<Footer />);
        let footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("pl-20");

        // Symulacja zmiany stanu sidebara
        mockUseSidebar.mockReturnValue({
          collapsed: false,
          toggle: vi.fn(),
          set: vi.fn(),
        });
        rerender(<Footer />);

        // Assert - padding zmieniony na pl-72
        footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("pl-72");
        expect(footer).not.toHaveClass("pl-20");
      });
    });
  });

  describe("Przekazywanie dodatkowych klas CSS", () => {
    it("powinien przyjąć i zastosować dodatkowe klasy z prop className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "custom-footer-class";

      // Act
      render(<Footer className={customClass} />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass(customClass);
    });

    it("powinien zachować wszystkie bazowe klasy po dodaniu className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "my-custom-footer";

      // Act
      render(<Footer className={customClass} />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("w-full");
      expect(footer).toHaveClass("h-[60px]");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("shadow-inner");
      expect(footer).toHaveClass(customClass);
    });

    it("powinien łączyć className z dynamicznym leftPadding", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "custom-footer";

      // Act
      render(<Footer className={customClass} />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("pl-72"); // dynamiczny padding
      expect(footer).toHaveClass(customClass); // custom className
    });

    it("powinien poprawnie działać bez przekazanego className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("w-full");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer className="" />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("w-full");
    });

    it("powinien obsłużyć undefined jako className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer className={undefined} />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass("w-full");
    });

    it("powinien umożliwić nadpisanie stylów przez className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const overrideClass = "h-[80px]"; // nadpisanie wysokości

      // Act
      render(<Footer className={overrideClass} />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass(overrideClass);
    });
  });

  describe("Integracja z useSidebar hook", () => {
    it("powinien pobierać collapsed state z useSidebar", () => {
      // Arrange
      const mockUseSidebar = vi.mocked(useSidebar);
      mockUseSidebar.mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      expect(mockUseSidebar).toHaveBeenCalledTimes(1);
    });

    it("powinien reagować na różne wartości collapsed z hooka", () => {
      // Arrange & Act - test z collapsed = false
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const { unmount } = render(<Footer />);
      let footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("pl-72");
      unmount();

      // Arrange & Act - test z collapsed = true
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      render(<Footer />);
      footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("pl-20");
    });

    it("nie powinien wywoływać toggle ani set z useSidebar (read-only usage)", () => {
      // Arrange
      const mockToggle = vi.fn();
      const mockSet = vi.fn();
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<Footer />);

      // Assert - Footer tylko odczytuje collapsed, nie modyfikuje
      expect(mockToggle).not.toHaveBeenCalled();
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe("Stałe wymiary i layout", () => {
    it("powinien mieć stałą wysokość 60px (h-[60px])", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("h-[60px]");
    });

    it("powinien mieć pełną szerokość (w-full)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("w-full");
    });

    it("powinien centrować zawartość w pionie i poziomie", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("flex");
      expect(footer).toHaveClass("items-center"); // vertical centering
      expect(footer).toHaveClass("justify-center"); // horizontal centering
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć wielokrotne re-renderowanie bez błędów", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const { rerender } = render(<Footer />);

      // Act & Assert
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();

      rerender(<Footer />);
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();

      rerender(<Footer />);
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("powinien obsłużyć zmianę className podczas re-renderowania", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const { rerender } = render(<Footer className="class-1" />);

      // Assert - początkowa klasa
      let footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("class-1");

      // Act - zmiana className
      rerender(<Footer className="class-2" />);

      // Assert - nowa klasa
      footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("class-2");
      expect(footer).not.toHaveClass("class-1");
    });

    it("powinien obsłużyć szybkie przełączanie stanu sidebara", () => {
      // Arrange
      const mockUseSidebar = vi.mocked(useSidebar);
      mockUseSidebar.mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act & Assert - szybkie przełączanie
      const { rerender } = render(<Footer />);

      // collapsed: false -> true
      mockUseSidebar.mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      rerender(<Footer />);
      expect(screen.getByRole("contentinfo")).toHaveClass("pl-20");

      // collapsed: true -> false
      mockUseSidebar.mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      rerender(<Footer />);
      expect(screen.getByRole("contentinfo")).toHaveClass("pl-72");

      // collapsed: false -> true -> false
      mockUseSidebar.mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      rerender(<Footer />);
      expect(screen.getByRole("contentinfo")).toHaveClass("pl-20");

      mockUseSidebar.mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      rerender(<Footer />);
      expect(screen.getByRole("contentinfo")).toHaveClass("pl-72");
    });

    it("powinien obsłużyć kombinację wszystkich props i stanów", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer className="custom-class extra-spacing" />);

      // Assert - wszystkie klasy razem
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("w-full");
      expect(footer).toHaveClass("h-[60px]");
      expect(footer).toHaveClass("pl-20"); // collapsed = true
      expect(footer).toHaveClass("px-6");
      expect(footer).toHaveClass("shadow-inner");
      expect(footer).toHaveClass("transition-all");
      expect(footer).toHaveClass("custom-class");
      expect(footer).toHaveClass("extra-spacing");
    });
  });

  describe("Accessibility", () => {
    it("powinien mieć rolę contentinfo (semantic footer)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toBeInTheDocument();
    });

    it("powinien mieć czytelny tekst z dobrym kontrastem (text-gray-100 na --color-primary)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const copyrightText = screen.getByText("Definition Quest 2025");
      expect(copyrightText).toHaveClass("text-gray-100");
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("bg-[var(--color-primary)]");
    });

    it("powinien być zawsze widoczny dla użytkowników screen readerów", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert - brak aria-hidden czy hidden
      const footer = screen.getByRole("contentinfo");
      expect(footer).not.toHaveAttribute("aria-hidden", "true");
      expect(footer).not.toHaveAttribute("hidden");
    });
  });

  describe("Semantyka HTML", () => {
    it("powinien używać semantycznego tagu <footer>", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer.tagName).toBe("FOOTER");
    });

    it("powinien zawierać element <p> dla tekstu copyright", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const copyrightText = screen.getByText("Definition Quest 2025");
      expect(copyrightText.tagName).toBe("P");
    });
  });

  describe("CSS Custom Properties", () => {
    it("powinien używać CSS variable dla background color", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("bg-[var(--color-primary)]");
    });

    it("powinien zachować spójność z system designu przez użycie CSS variables", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert - weryfikacja że używamy themowania
      const footer = screen.getByRole("contentinfo");
      const classList = footer.className;
      expect(classList).toContain("var(--color-primary)");
    });
  });

  describe("Kalkulacja paddingu", () => {
    it("powinien dodać 4rem (64px) do szerokości rozwiniętego sidebara dla bezpieczeństwa", () => {
      // Arrange - sidebar rozwinięty to 16rem (w-64), więc padding powinien być 20rem (pl-72 = 18rem)
      // Komentarz w kodzie mówi: "Sidebar widths: collapsed w-16 (4rem) vs expanded w-64 (16rem)"
      // leftPadding dla expanded: pl-72 = 18rem = 288px (sidebar 256px + padding wewnętrzny px-6 = 24px + margines bezpieczeństwa)
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("pl-72"); // 18rem = 288px total spacing
    });

    it("powinien dodać 4rem (64px) do szerokości zwiniętego sidebara dla bezpieczeństwa", () => {
      // Arrange - sidebar zwinięty to 4rem (w-16), więc padding powinien być 5rem (pl-20)
      // leftPadding dla collapsed: pl-20 = 5rem = 80px (sidebar 64px + margines bezpieczeństwa)
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Footer />);

      // Assert
      const footer = screen.getByRole("contentinfo");
      expect(footer).toHaveClass("pl-20"); // 5rem = 80px total spacing
    });
  });
});
