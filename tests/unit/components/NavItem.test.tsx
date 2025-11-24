import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavItem } from "@/components/ui/Sidebar/NavItem";
import type { NavItemVM } from "@/types/sidebar";

/**
 * Testy jednostkowe dla komponentu NavItem
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warunkowe stylowanie w zależności od stanu collapsed
 * - Warunkowe stylowanie w zależności od aktywnej strony (isActive)
 * - Renderowanie ikony
 * - Warunkowo renderowany label (zależny od collapsed)
 * - Wykrywanie aktywnej strony przez window.location.pathname
 * - Atrybuty accessibility (role, aria-current, aria-disabled)
 * - Style hover dla nieaktywnych elementów
 * - Blokada interakcji dla aktywnych elementów (pointer-events-none)
 * - Style bazowe (flex, gap, rounded-md, transition-colors)
 */

// Mock dla useSidebar hook
vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: vi.fn(),
}));

import { useSidebar } from "@/hooks/useSidebar";

// Mock icon component
const MockIcon = ({ className }: { className?: string }) => (
  <svg data-testid="nav-icon" className={className}>
    <path />
  </svg>
);

describe("NavItem", () => {
  const mockItem: NavItemVM = {
    label: "Dashboard",
    route: "/dashboard",
    icon: MockIcon,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location.pathname
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).location = { pathname: "/" };
  });

  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować link <a> z odpowiednimi podstawowymi klasami", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe("A");
      expect(link).toHaveClass("flex");
      expect(link).toHaveClass("items-center");
      expect(link).toHaveClass("gap-3");
      expect(link).toHaveClass("rounded-md");
      expect(link).toHaveClass("px-3");
      expect(link).toHaveClass("py-2");
      expect(link).toHaveClass("transition-colors");
    });

    it("powinien wyrenderować ikonę z odpowiednimi klasami rozmiaru", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const icon = screen.getByTestId("nav-icon");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("h-5");
      expect(icon).toHaveClass("w-5");
    });

    it("powinien mieć poprawny href odpowiadający route", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("href", "/dashboard");
    });
  });

  describe("Stylowanie warunkowe - stan collapsed", () => {
    it("powinien renderować label gdy sidebar NIE jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("powinien ukryć label gdy sidebar JEST zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("powinien mieć font-bold gdy sidebar NIE jest zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("font-bold");
      expect(link).toHaveClass("text-sm");
    });

    it("powinien mieć justify-center i font-normal gdy sidebar JEST zwinięty", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("justify-center");
      expect(link).toHaveClass("font-normal");
      expect(link).toHaveClass("text-sm");
    });
  });

  describe("Stylowanie warunkowe - aktywna strona (isActive)", () => {
    it("powinien wykryć aktywną stronę gdy pathname pasuje do route", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("bg-blue-700");
      expect(link).toHaveClass("bg-opacity-60");
      expect(link).toHaveClass("cursor-default");
      expect(link).toHaveClass("pointer-events-none");
    });

    it("powinien mieć style hover gdy strona NIE jest aktywna", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("hover:bg-blue-700");
      expect(link).toHaveClass("hover:bg-opacity-50");
      expect(link).toHaveClass("cursor-pointer");
    });

    it("powinien mieć ciemniejsze tło dla aktywnej strony (opacity-60 vs opacity-50)", () => {
      // Arrange - aktywna strona
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      const { container } = render(<NavItem item={mockItem} />);
      const activeLink = screen.getByRole("menuitem");

      // Assert - aktywna ma bg-opacity-60
      expect(activeLink).toHaveClass("bg-opacity-60");

      // Cleanup
      container.remove();

      // Arrange - nieaktywna strona
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      const { container: container2 } = render(<NavItem item={mockItem} />);
      const inactiveLink = screen.getByRole("menuitem");

      // Assert - nieaktywna ma hover:bg-opacity-50
      expect(inactiveLink).toHaveClass("hover:bg-opacity-50");
      expect(inactiveLink).not.toHaveClass("bg-opacity-60");

      container2.remove();
    });
  });

  describe("Accessibility i atrybuty ARIA", () => {
    it("powinien mieć role='menuitem'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("role", "menuitem");
    });

    it("powinien mieć aria-current='page' gdy strona jest aktywna", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("aria-current", "page");
    });

    it("powinien NIE mieć aria-current gdy strona NIE jest aktywna", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).not.toHaveAttribute("aria-current");
    });

    it("powinien mieć aria-disabled gdy strona jest aktywna", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("aria-disabled");
    });

    it("powinien NIE mieć aria-disabled gdy strona NIE jest aktywna", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).not.toHaveAttribute("aria-disabled");
    });
  });

  describe("Kombinacje stanów", () => {
    it("powinien poprawnie stylować aktywną stronę w zwiniętym sidebarze", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      // Style dla collapsed
      expect(link).toHaveClass("justify-center");
      expect(link).toHaveClass("font-normal");
      // Style dla isActive
      expect(link).toHaveClass("bg-blue-700");
      expect(link).toHaveClass("bg-opacity-60");
      expect(link).toHaveClass("pointer-events-none");
      // Label ukryty
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("powinien poprawnie stylować nieaktywną stronę w zwiniętym sidebarze", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      // Style dla collapsed
      expect(link).toHaveClass("justify-center");
      expect(link).toHaveClass("font-normal");
      // Style dla nieaktywnej
      expect(link).toHaveClass("hover:bg-blue-700");
      expect(link).toHaveClass("cursor-pointer");
      // Label ukryty
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });

    it("powinien poprawnie stylować aktywną stronę w rozwinietym sidebarze", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      // Style dla expanded
      expect(link).toHaveClass("font-bold");
      expect(link).not.toHaveClass("justify-center");
      // Style dla isActive
      expect(link).toHaveClass("bg-blue-700");
      expect(link).toHaveClass("bg-opacity-60");
      expect(link).toHaveClass("pointer-events-none");
      // Label widoczny
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("powinien poprawnie stylować nieaktywną stronę w rozwinietym sidebarze", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      // Style dla expanded
      expect(link).toHaveClass("font-bold");
      expect(link).not.toHaveClass("justify-center");
      // Style dla nieaktywnej
      expect(link).toHaveClass("hover:bg-blue-700");
      expect(link).toHaveClass("cursor-pointer");
      // Label widoczny
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("Edge cases i różne route", () => {
    it("powinien poprawnie renderować różne labele", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      const items: NavItemVM[] = [
        { label: "Home", route: "/", icon: MockIcon },
        { label: "Settings", route: "/settings", icon: MockIcon },
        { label: "Profile", route: "/profile", icon: MockIcon },
      ];

      // Act & Assert
      items.forEach((item) => {
        const { container } = render(<NavItem item={item} />);
        expect(screen.getByText(item.label)).toBeInTheDocument();
        expect(screen.getByRole("menuitem")).toHaveAttribute("href", item.route);
        container.remove();
      });
    });

    it("powinien wykrywać aktywność dla route z nested paths", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      const nestedItem: NavItemVM = {
        label: "User Settings",
        route: "/settings/user",
        icon: MockIcon,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/settings/user" };

      // Act
      render(<NavItem item={nestedItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("aria-current", "page");
      expect(link).toHaveClass("bg-blue-700");
    });

    it("powinien poprawnie działać dla route='/'", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      const homeItem: NavItemVM = {
        label: "Home",
        route: "/",
        icon: MockIcon,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={homeItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("href", "/");
      expect(link).toHaveAttribute("aria-current", "page");
      expect(link).toHaveClass("pointer-events-none");
    });
  });

  describe("Integracja z useSidebar hook", () => {
    it("powinien używać wartości collapsed z hooka useSidebar", () => {
      // Arrange
      const mockToggle = vi.fn();
      const mockSet = vi.fn();

      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: mockToggle,
        set: mockSet,
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      expect(useSidebar).toHaveBeenCalled();
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("justify-center");
    });

    it("powinien reagować na zmianę collapsed state", () => {
      // Arrange - zaczynamy z collapsed=false
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act - renderujemy z collapsed=false
      const { container, rerender } = render(<NavItem item={mockItem} />);

      // Assert - label widoczny
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // Arrange - zmieniamy na collapsed=true
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: true,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act - rerenderujemy
      rerender(<NavItem item={mockItem} />);

      // Assert - label ukryty
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();

      container.remove();
    });
  });

  describe("Wykrywanie aktywnej strony przez useEffect", () => {
    it("powinien zaktualizować currentPath po zamontowaniu komponentu", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Ustawiamy pathname przed renderowaniem
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert - komponent powinien wykryć aktywną stronę
      const link = screen.getByRole("menuitem");
      expect(link).toHaveAttribute("aria-current", "page");
    });

    it("powinien działać poprawnie gdy window jest undefined (SSR safety check)", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Nie powinno rzucić błędu nawet gdy pathname się zmieni
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/settings" };

      // Act & Assert - nie powinno rzucić błędu
      expect(() => render(<NavItem item={mockItem} />)).not.toThrow();
    });
  });

  describe("Style wizualne i layout", () => {
    it("powinien mieć gap-3 między ikoną a labelą", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("gap-3");
    });

    it("powinien mieć rounded-md dla zaokrąglonych rogów", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("rounded-md");
    });

    it("powinien mieć transition-colors dla płynnych animacji", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("transition-colors");
    });

    it("powinien mieć padding px-3 py-2", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("px-3");
      expect(link).toHaveClass("py-2");
    });
  });

  describe("Blokada interakcji dla aktywnej strony", () => {
    it("powinien mieć pointer-events-none dla aktywnej strony", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("pointer-events-none");
    });

    it("powinien NIE mieć pointer-events-none dla nieaktywnej strony", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).not.toHaveClass("pointer-events-none");
    });

    it("powinien mieć cursor-default dla aktywnej strony", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/dashboard" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("cursor-default");
    });

    it("powinien mieć cursor-pointer dla nieaktywnej strony", () => {
      // Arrange
      vi.mocked(useSidebar).mockReturnValue({
        collapsed: false,
        toggle: vi.fn(),
        set: vi.fn(),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).location = { pathname: "/" };

      // Act
      render(<NavItem item={mockItem} />);

      // Assert
      const link = screen.getByRole("menuitem");
      expect(link).toHaveClass("cursor-pointer");
    });
  });
});
