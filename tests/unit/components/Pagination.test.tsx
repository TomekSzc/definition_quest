import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/ui/Pagination";
import type { PaginationMeta } from "@/types";

/**
 * Testy jednostkowe dla komponentu Pagination
 *
 * Testowane funkcjonalności:
 * - Podstawowe renderowanie i struktura DOM
 * - Warunkowe renderowanie (brak meta lub total <= pageSize)
 * - Wyświetlanie informacji o aktualnej stronie
 * - Obliczanie i wyświetlanie całkowitej liczby stron
 * - Interakcje użytkownika (przyciski poprzednia/następna)
 * - Stan disabled przycisków (pierwsza/ostatnia strona)
 * - Callback onPageChange z prawidłowymi wartościami
 * - Style bazowe Tailwind CSS
 * - Accessibility (aria-label, focus-visible, disabled state)
 */

describe("Pagination", () => {
  describe("Renderowanie i struktura DOM", () => {
    it("powinien wyrenderować nav z aria-label", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("aria-label", "Paginacja");
      expect(nav.tagName).toBe("NAV");
    });

    it("powinien zawierać dwa przyciski i informację o stronie", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent("← Poprzednia");
      expect(buttons[1]).toHaveTextContent("Następna →");
      expect(screen.getByText("2 / 5")).toBeInTheDocument();
    });

    it("powinien wyświetlić prawidłowy numer strony i całkowitą liczbę stron", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 20,
        total: 100,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("3 / 5")).toBeInTheDocument();
    });
  });

  describe("Warunkowe renderowanie", () => {
    it("nie powinien renderować niczego gdy meta jest undefined", () => {
      // Arrange & Act
      const { container } = render(<Pagination onPageChange={vi.fn()} meta={undefined} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });

    it("nie powinien renderować niczego gdy total <= pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 10,
      };

      // Act
      const { container } = render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });

    it("nie powinien renderować niczego gdy total < pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 20,
        total: 5,
      };

      // Act
      const { container } = render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(container).toBeEmptyDOMElement();
    });

    it("powinien renderować gdy total > pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 11,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByRole("navigation")).toBeInTheDocument();
    });
  });

  describe("Obliczanie liczby stron", () => {
    it("powinien obliczyć prawidłową liczbę stron dla total podzielnego przez pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 100,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("1 / 10")).toBeInTheDocument();
    });

    it("powinien zaokrąglić w górę liczbę stron dla total niepodzielnego przez pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 95,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("1 / 10")).toBeInTheDocument();
    });

    it("powinien prawidłowo obliczyć 2 strony dla 11 elementów i pageSize 10", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 11,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });

    it("powinien prawidłowo obliczyć 1 stronę dla 21 elementów i pageSize 25", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 25,
        total: 21,
      };

      // Act
      const { container } = render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert - nie renderuje bo total <= pageSize
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("Stan disabled przycisków", () => {
    it("przycisk 'Poprzednia' powinien być disabled na pierwszej stronie", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      expect(prevButton).toBeDisabled();
    });

    it("przycisk 'Następna' powinien być disabled na ostatniej stronie", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 5,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const nextButton = screen.getByRole("button", { name: /następna/i });
      expect(nextButton).toBeDisabled();
    });

    it("oba przyciski powinny być enabled na środkowej stronie", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      const nextButton = screen.getByRole("button", { name: /następna/i });
      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("przycisk 'Poprzednia' powinien być enabled na drugiej stronie", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      expect(prevButton).not.toBeDisabled();
    });

    it("przycisk 'Następna' powinien być enabled na przedostatniej stronie", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 4,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const nextButton = screen.getByRole("button", { name: /następna/i });
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Interakcje użytkownika - onClick", () => {
    it("powinien wywołać onPageChange z poprzednią stroną po kliknięciu 'Poprzednia'", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      await user.click(prevButton);

      // Assert
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("powinien wywołać onPageChange z następną stroną po kliknięciu 'Następna'", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const nextButton = screen.getByRole("button", { name: /następna/i });
      await user.click(nextButton);

      // Assert
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("nie powinien wywołać onPageChange przy kliknięciu disabled przycisku 'Poprzednia'", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      await user.click(prevButton);

      // Assert
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("nie powinien wywołać onPageChange przy kliknięciu disabled przycisku 'Następna'", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 5,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const nextButton = screen.getByRole("button", { name: /następna/i });
      await user.click(nextButton);

      // Assert
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("powinien wywołać onPageChange wielokrotnie przy kolejnych kliknięciach", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const nextButton = screen.getByRole("button", { name: /następna/i });
      await user.click(nextButton);
      await user.click(nextButton);

      // Assert
      expect(onPageChange).toHaveBeenCalledTimes(2);
      expect(onPageChange).toHaveBeenNthCalledWith(1, 4);
      expect(onPageChange).toHaveBeenNthCalledWith(2, 4);
    });

    it("powinien wywołać onPageChange z page-1 przy kliknięciu ze strony 2", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      await user.click(prevButton);

      // Assert
      expect(onPageChange).toHaveBeenCalledWith(1);
    });
  });

  describe("Style bazowe Tailwind CSS", () => {
    it("nav powinien mieć klasy flex, items-center, justify-center i gap-2", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("mt-6");
      expect(nav).toHaveClass("flex");
      expect(nav).toHaveClass("items-center");
      expect(nav).toHaveClass("justify-center");
      expect(nav).toHaveClass("gap-2");
    });

    it("nav powinien używać CSS variable dla koloru tekstu", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("text-[var(--color-primary)]");
    });

    it("przyciski powinny mieć podstawowe klasy stylowania", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("cursor-pointer");
        expect(button).toHaveClass("rounded");
        expect(button).toHaveClass("px-2");
        expect(button).toHaveClass("py-1");
        expect(button).toHaveClass("text-sm");
      });
    });

    it("przyciski powinny mieć klasy hover state", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("hover:bg-muted");
      });
    });

    it("przyciski powinny mieć klasy focus-visible dla accessibility", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("focus-visible:ring-2");
        expect(button).toHaveClass("focus-visible:ring-ring");
      });
    });

    it("przyciski powinny mieć klasy disabled state", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass("disabled:opacity-50");
      });
    });

    it("span z informacją o stronie powinien mieć klasę text-sm", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const pageInfo = screen.getByText("2 / 5");
      expect(pageInfo).toHaveClass("text-sm");
      expect(pageInfo.tagName).toBe("SPAN");
    });
  });

  describe("Accessibility", () => {
    it("nav powinien mieć prawidłowy aria-label", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const nav = screen.getByRole("navigation", { name: "Paginacja" });
      expect(nav).toBeInTheDocument();
    });

    it("disabled przyciski powinny być oznaczone atrybutem disabled", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      expect(prevButton).toHaveAttribute("disabled");
    });

    it("enabled przyciski nie powinny mieć atrybutu disabled", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      const nextButton = screen.getByRole("button", { name: /następna/i });
      expect(prevButton).not.toHaveAttribute("disabled");
      expect(nextButton).not.toHaveAttribute("disabled");
    });

    it("przyciski powinny mieć opisowy tekst dla screen readers", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByRole("button", { name: /poprzednia/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /następna/i })).toBeInTheDocument();
    });

    it("informacja o aktualnej stronie powinna być dostępna dla screen readers", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      const pageInfo = screen.getByText("3 / 5");
      expect(pageInfo).toBeVisible();
      expect(pageInfo).toHaveTextContent("3 / 5");
    });
  });

  describe("Edge cases", () => {
    it("powinien obsłużyć pojedynczą dodatkową stronę (11 elementów, pageSize 10)", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 11,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
      const nextButton = screen.getByRole("button", { name: /następna/i });
      expect(nextButton).not.toBeDisabled();
    });

    it("powinien obsłużyć duże liczby stron", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 50,
        pageSize: 10,
        total: 1000,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("50 / 100")).toBeInTheDocument();
    });

    it("powinien obsłużyć niestandardowy pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 25,
        total: 100,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("1 / 4")).toBeInTheDocument();
    });

    it("powinien obsłużyć ostatnią stronę z niepełną liczbą elementów", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 10,
        total: 25,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      expect(screen.getByText("3 / 3")).toBeInTheDocument();
      const nextButton = screen.getByRole("button", { name: /następna/i });
      expect(nextButton).toBeDisabled();
    });

    it("powinien prawidłowo obliczyć totalPages dla 1 elementu więcej niż pageSize", () => {
      // Arrange
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 20,
        total: 21,
      };

      // Act
      render(<Pagination onPageChange={vi.fn()} meta={meta} />);

      // Assert
      // Nie renderuje bo 21 <= 20 jest false, więc powinien renderować
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  describe("Integracja - scenariusze użytkownika", () => {
    it("użytkownik przechodzi z pierwszej na drugą stronę", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const nextButton = screen.getByRole("button", { name: /następna/i });
      await user.click(nextButton);

      // Assert
      expect(onPageChange).toHaveBeenCalledWith(2);
      expect(screen.getByText("1 / 5")).toBeInTheDocument();
    });

    it("użytkownik wraca z trzeciej na drugą stronę", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 3,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });
      await user.click(prevButton);

      // Assert
      expect(onPageChange).toHaveBeenCalledWith(2);
      expect(screen.getByText("3 / 5")).toBeInTheDocument();
    });

    it("użytkownik próbuje przejść poza pierwszą stronę", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 1,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const prevButton = screen.getByRole("button", { name: /poprzednia/i });

      // Assert - przycisk disabled, więc kliknięcie nie zadziała
      expect(prevButton).toBeDisabled();
      await user.click(prevButton);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("użytkownik próbuje przejść poza ostatnią stronę", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 5,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const nextButton = screen.getByRole("button", { name: /następna/i });

      // Assert - przycisk disabled, więc kliknięcie nie zadziała
      expect(nextButton).toBeDisabled();
      await user.click(nextButton);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("użytkownik nawiguje używając klawiatury (Tab + Enter)", async () => {
      // Arrange
      const user = userEvent.setup();
      const onPageChange = vi.fn();
      const meta: PaginationMeta = {
        page: 2,
        pageSize: 10,
        total: 50,
      };

      // Act
      render(<Pagination onPageChange={onPageChange} meta={meta} />);
      const nextButton = screen.getByRole("button", { name: /następna/i });

      nextButton.focus();
      await user.keyboard("{Enter}");

      // Assert
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });
});
