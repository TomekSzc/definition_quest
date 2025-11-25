import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SidebarToggleButton } from "@/components/ui/Sidebar/SidebarToggleButton";

/**
 * Testy jednostkowe dla komponentu SidebarToggleButton
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warunkowe renderowanie ikony w zależności od stanu collapsed (MenuIcon vs ChevronLeftIcon)
 * - Warunkowe stylowanie w zależności od stanu collapsed
 * - Atrybuty accessibility (aria-label, aria-pressed)
 * - Obsługa interakcji użytkownika (onClick -> toggle)
 * - Style bazowe (flex, gap, rounded-md, hover, transition-colors)
 * - Responsywne pozycjonowanie dla stanu collapsed
 */

// Mock dla useSidebar hook
vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: vi.fn(),
}));

// Mock icon components
vi.mock("@/assets/icons", () => ({
  MenuIcon: ({ className }: { className?: string }) => (
    <svg data-testid="menu-icon" className={className}>
      <path />
    </svg>
  ),
  ChevronLeftIcon: ({ className }: { className?: string }) => (
    <svg data-testid="chevron-left-icon" className={className}>
      <path />
    </svg>
  ),
}));

import { useSidebar } from "@/hooks/useSidebar";

describe("SidebarToggleButton", () => {
  const mockToggle = vi.fn();
  const mockSet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Podstawowe renderowanie i struktura DOM", () => {
    it("powinien wyrenderować button z odpowiednimi podstawowymi klasami", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
      expect(button).toHaveClass("flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("gap-3");
      expect(button).toHaveClass("rounded-md");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("transition-colors");
      expect(button).toHaveClass("text-white");
      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("cursor-pointer");
    });

    it("powinien mieć klasę hover:bg-blue-700", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-blue-700");
      expect(button).toHaveClass("hover:bg-opacity-50");
    });

    it("powinien mieć klasę mt-2.4", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("mt-2.4");
    });
  });

  describe("Warunkowe renderowanie ikony", () => {
    it("powinien renderować ChevronLeftIcon gdy sidebar jest rozwinięty (collapsed = false)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const chevronIcon = screen.getByTestId("chevron-left-icon");
      expect(chevronIcon).toBeInTheDocument();
      expect(chevronIcon).toHaveClass("h-5");
      expect(chevronIcon).toHaveClass("w-5");

      const menuIcon = screen.queryByTestId("menu-icon");
      expect(menuIcon).not.toBeInTheDocument();
    });

    it("powinien renderować MenuIcon gdy sidebar jest zwinięty (collapsed = true)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const menuIcon = screen.getByTestId("menu-icon");
      expect(menuIcon).toBeInTheDocument();
      expect(menuIcon).toHaveClass("h-5");
      expect(menuIcon).toHaveClass("w-5");

      const chevronIcon = screen.queryByTestId("chevron-left-icon");
      expect(chevronIcon).not.toBeInTheDocument();
    });
  });

  describe("Warunkowe stylowanie w zależności od stanu collapsed", () => {
    it("powinien mieć klasę px-3 gdy sidebar jest rozwinięty (collapsed = false)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-3");
      expect(button).not.toHaveClass("justify-center");
    });

    it("powinien mieć klasy justify-center i pozycjonowanie absolute/relative gdy sidebar jest zwinięty (collapsed = true)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveClass("justify-center");
      expect(button.className).toContain("position:");
      expect(button.className).toContain("absolute");
      expect(button.className).toContain("md:relative");
      expect(button.className).toContain("left-13");
      expect(button.className).toContain("top-3");
      expect(button.className).toContain("md:top-[unset]");
      expect(button.className).toContain("md:left-[unset]");
      expect(button).not.toHaveClass("px-3");
    });
  });

  describe("Atrybuty accessibility", () => {
    it('powinien mieć aria-label "Expand sidebar" gdy sidebar jest zwinięty (collapsed = true)', () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Expand sidebar");
    });

    it('powinien mieć aria-label "Collapse sidebar" gdy sidebar jest rozwinięty (collapsed = false)', () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Collapse sidebar");
    });

    it('powinien mieć aria-pressed="true" gdy sidebar jest zwinięty (collapsed = true)', () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
    });

    it('powinien mieć aria-pressed="false" gdy sidebar jest rozwinięty (collapsed = false)', () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });
  });

  describe("Obsługa interakcji użytkownika", () => {
    it("powinien wywołać funkcję toggle z useSidebar przy kliknięciu", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Assert
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("powinien wywołać toggle niezależnie od stanu collapsed", () => {
      // Arrange - collapsed = true
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      const { rerender } = render(<SidebarToggleButton />);
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Assert
      expect(mockToggle).toHaveBeenCalledTimes(1);

      // Arrange - collapsed = false
      vi.clearAllMocks();
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      rerender(<SidebarToggleButton />);
      fireEvent.click(button);

      // Assert
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });

    it("powinien wywołać toggle wielokrotnie przy wielokrotnych kliknięciach", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      // Assert
      expect(mockToggle).toHaveBeenCalledTimes(3);
    });

    it("nie powinien wywołać funkcji set z useSidebar (tylko toggle)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);
      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Assert
      expect(mockToggle).toHaveBeenCalledTimes(1);
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe("Integracja z useSidebar hook", () => {
    it("powinien poprawnie odczytać stan collapsed z useSidebar", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);

      // Assert
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-pressed", "true");
      expect(button).toHaveAttribute("aria-label", "Expand sidebar");
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
    });

    it("powinien reagować na zmianę stanu collapsed", () => {
      // Arrange - początkowy stan collapsed = false
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      const { rerender } = render(<SidebarToggleButton />);

      // Assert - początkowy stan
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByTestId("chevron-left-icon")).toBeInTheDocument();

      // Arrange - zmiana stanu na collapsed = true
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      rerender(<SidebarToggleButton />);

      // Assert - nowy stan
      expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByTestId("menu-icon")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("powinien działać poprawnie gdy toggle jest undefined (edge case)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        toggle: undefined as any,
        set: mockSet,
      });

      // Act & Assert - nie powinno wyrzucić błędu podczas renderowania
      expect(() => render(<SidebarToggleButton />)).not.toThrow();
    });

    it("powinien poprawnie obsługiwać szybkie wielokrotne kliknięcia", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<SidebarToggleButton />);
      const button = screen.getByRole("button");

      // Symulacja szybkich kliknięć
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      // Assert
      expect(mockToggle).toHaveBeenCalledTimes(10);
    });
  });
});
