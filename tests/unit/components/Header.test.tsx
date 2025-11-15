import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "@/components/ui/Header";

/**
 * Testy jednostkowe dla komponentu Header
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Dynamiczny leftPadding w zależności od stanu sidebara
 * - Responsywna widoczność breadcrumbs
 * - Przekazywanie dodatkowych klas CSS
 * - Integracja z useSidebar hook
 * - Fixed positioning i style wizualne
 */

// Mock dla useSidebar hook
vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: vi.fn(),
}));

// Mock dla komponentu Breadcrumbs
vi.mock("@/components/ui/Breadcrumbs", () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

import { useSidebar } from "@/hooks/useSidebar";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować element header z odpowiednimi podstawowymi klasami", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("w-full");
      expect(header).toHaveClass("fixed");
      expect(header).toHaveClass("top-0");
      expect(header).toHaveClass("h-[60px]");
      expect(header).toHaveClass("shadow-md");
    });

    it("powinien renderować komponent Breadcrumbs wewnątrz header", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const breadcrumbs = screen.getByTestId("breadcrumbs");
      expect(breadcrumbs).toBeInTheDocument();
    });

    it("powinien mieć poprawne style layout (flex, items-center, padding)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("flex");
      expect(header).toHaveClass("items-center");
      expect(header).toHaveClass("px-6");
    });

    it("powinien mieć z-index ustawiony na [1]", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("z-[1]");
    });

    it("powinien mieć ustawione transition classes", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("transition-all");
      expect(header).toHaveClass("duration-200");
    });
  });

  describe("Dynamiczny leftPadding w zależności od stanu sidebara", () => {
    it("powinien ustawić pl-72 gdy sidebar NIE jest collapsed", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-72");
      expect(header).not.toHaveClass("pl-13");
    });

    it("powinien ustawić pl-13 gdy sidebar JEST collapsed", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-13");
      expect(header).not.toHaveClass("pl-72");
    });
  });

  describe("Responsywna widoczność breadcrumbs", () => {
    it("powinien ustawić 'hidden md:block' dla breadcrumbs gdy sidebar NIE jest collapsed", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const breadcrumbsContainer = screen.getByTestId("breadcrumbs").parentElement;
      expect(breadcrumbsContainer).toHaveClass("hidden");
      expect(breadcrumbsContainer).toHaveClass("md:block");
    });

    it("powinien ustawić 'block' dla breadcrumbs gdy sidebar JEST collapsed", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const breadcrumbsContainer = screen.getByTestId("breadcrumbs").parentElement;
      expect(breadcrumbsContainer).toHaveClass("block");
      expect(breadcrumbsContainer).not.toHaveClass("hidden");
    });
  });

  describe("Przekazywanie dodatkowych klas CSS", () => {
    it("powinien przyjąć i zastosować dodatkowe klasy CSS z prop className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "custom-header-class";

      // Act
      render(<Header className={customClass} />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass(customClass);
    });

    it("powinien zachować wszystkie podstawowe klasy po dodaniu className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "my-custom-class";

      // Act
      render(<Header className={customClass} />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("w-full");
      expect(header).toHaveClass("fixed");
      expect(header).toHaveClass("h-[60px]");
      expect(header).toHaveClass(customClass);
    });

    it("powinien poprawnie działać bez przekazanego className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("w-full");
    });
  });

  describe("Integracja z useSidebar hook", () => {
    it("powinien wywołać useSidebar hook przy renderowaniu", () => {
      // Arrange
      const mockUseSidebar = vi.mocked(useSidebar);
      mockUseSidebar.mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      expect(mockUseSidebar).toHaveBeenCalled();
    });

    it("powinien reagować na zmianę stanu collapsed z hooka", () => {
      // Arrange
      const mockUseSidebar = vi.mocked(useSidebar);
      mockUseSidebar.mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-13");
    });
  });

  describe("Style wizualne i tło", () => {
    it("powinien mieć tło ustawione przez zmienną CSS --color-primary", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("bg-[var(--color-primary)]");
    });

    it("powinien mieć klasę shadow-md dla cienia", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("shadow-md");
    });
  });

  describe("Accessibility", () => {
    it("powinien używać semantycznego tagu <header>", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header.tagName).toBe("HEADER");
    });

    it("powinien być dostępny przez role 'banner'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
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

      // Act
      const { rerender } = render(<Header />);
      rerender(<Header />);
      rerender(<Header />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
    });

    it("powinien obsłużyć zmianę collapsed z false na true", () => {
      // Arrange
      const mockUseSidebar = vi.mocked(useSidebar);
      mockUseSidebar.mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act - pierwsze renderowanie
      const { rerender } = render(<Header />);
      let header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-72");

      // Arrange - zmiana stanu
      mockUseSidebar.mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act - re-renderowanie z nowym stanem
      rerender(<Header />);

      // Assert
      header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-13");
      expect(header).not.toHaveClass("pl-72");
    });

    it("powinien obsłużyć zmianę collapsed z true na false", () => {
      // Arrange
      const mockUseSidebar = vi.mocked(useSidebar);
      mockUseSidebar.mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act - pierwsze renderowanie
      const { rerender } = render(<Header />);
      let header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-13");

      // Arrange - zmiana stanu
      mockUseSidebar.mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act - re-renderowanie z nowym stanem
      rerender(<Header />);

      // Assert
      header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-72");
      expect(header).not.toHaveClass("pl-13");
    });

    it("powinien obsłużyć pusty string jako className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header className="" />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("w-full");
    });

    it("powinien obsłużyć undefined jako className", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<Header className={undefined} />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("w-full");
    });
  });

  describe("Kombinacje stanów", () => {
    it("powinien poprawnie ustawić wszystkie klasy gdy sidebar collapsed=true i className jest podany", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "test-class";

      // Act
      render(<Header className={customClass} />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-13");
      expect(header).toHaveClass(customClass);
      expect(header).toHaveClass("w-full");

      const breadcrumbsContainer = screen.getByTestId("breadcrumbs").parentElement;
      expect(breadcrumbsContainer).toHaveClass("block");
    });

    it("powinien poprawnie ustawić wszystkie klasy gdy sidebar collapsed=false i className jest podany", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      const customClass = "another-test-class";

      // Act
      render(<Header className={customClass} />);

      // Assert
      const header = screen.getByRole("banner");
      expect(header).toHaveClass("pl-72");
      expect(header).toHaveClass(customClass);
      expect(header).toHaveClass("w-full");

      const breadcrumbsContainer = screen.getByTestId("breadcrumbs").parentElement;
      expect(breadcrumbsContainer).toHaveClass("hidden");
      expect(breadcrumbsContainer).toHaveClass("md:block");
    });
  });
});

