import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PairForm from "@/components/forms/PairForm";
import type { UseFormRegister } from "react-hook-form";
import type { CreateBoardFormValues } from "@/components/forms/CreateBoardForm";

/**
 * -----------------------------------------
 * Test doubles & mocks
 * -----------------------------------------
 */

// Mock PairFormRow to simplify testing
vi.mock("@/components/forms/PairFormRow", () => ({
  default: ({
    index,
    onRemove,
  }: {
    index: number;
    register: UseFormRegister<CreateBoardFormValues>;
    errors?: { term?: { message?: string }; definition?: { message?: string } };
    onRemove: () => void;
  }) => (
    <div data-testid={`pair-row-${index}`}>
      <input data-testid={`pair-term-${index}`} />
      <input data-testid={`pair-definition-${index}`} />
      <button data-testid={`remove-pair-${index}`} onClick={onRemove}>
        Remove
      </button>
    </div>
  ),
}));

/**
 * -----------------------------------------
 * Helper functions
 * -----------------------------------------
 */

const createMockFields = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({ id: `field-${i}` }));
};

const createMockRegister = () => vi.fn() as unknown as UseFormRegister<CreateBoardFormValues>;

/**
 * -----------------------------------------
 * Tests
 * -----------------------------------------
 */

describe("PairForm", () => {
  describe("Rendering", () => {
    it("renders all pair rows based on fields array", () => {
      const fields = createMockFields(4);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      expect(screen.getAllByTestId(/^pair-row-/)).toHaveLength(4);
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-2")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-3")).toBeInTheDocument();
    });

    it("renders with no fields when fields array is empty", () => {
      const fields: { id: string }[] = [];
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      expect(screen.queryByTestId(/^pair-row-/)).not.toBeInTheDocument();
    });
  });

  describe("Level grouping with cardCount=16", () => {
    it("displays level headers correctly for cardCount=16 (max 8 pairs per level)", () => {
      // For cardCount=16: maxPerLevel = 16/2 = 8
      // indices 0-7 = Level 1, indices 8-15 = Level 2
      const fields = createMockFields(16);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      // Level 1 should appear at index 0
      const level1Headers = screen.getAllByText("Level: 1");
      expect(level1Headers).toHaveLength(1);

      // Level 2 should appear at index 8
      const level2Headers = screen.getAllByText("Level: 2");
      expect(level2Headers).toHaveLength(1);
    });

    it("displays only level 1 header when there are fewer than 9 pairs", () => {
      const fields = createMockFields(5);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      expect(screen.getByText("Level: 1")).toBeInTheDocument();
      expect(screen.queryByText("Level: 2")).not.toBeInTheDocument();
    });
  });

  describe("Level grouping with cardCount=24", () => {
    it("displays level headers correctly for cardCount=24 (max 12 pairs per level)", () => {
      // For cardCount=24: maxPerLevel = 24/2 = 12
      // indices 0-11 = Level 1, indices 12-23 = Level 2
      const fields = createMockFields(24);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={24} />);

      // Level 1 should appear at index 0
      const level1Headers = screen.getAllByText("Level: 1");
      expect(level1Headers).toHaveLength(1);

      // Level 2 should appear at index 12
      const level2Headers = screen.getAllByText("Level: 2");
      expect(level2Headers).toHaveLength(1);
    });

    it("displays only level 1 header when there are fewer than 13 pairs", () => {
      const fields = createMockFields(10);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={24} />);

      expect(screen.getByText("Level: 1")).toBeInTheDocument();
      expect(screen.queryByText("Level: 2")).not.toBeInTheDocument();
    });

    it("displays three level headers when there are more than 24 pairs", () => {
      // For cardCount=24: maxPerLevel = 12
      // indices 0-11 = Level 1, indices 12-23 = Level 2, indices 24-35 = Level 3
      const fields = createMockFields(30);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={24} />);

      expect(screen.getByText("Level: 1")).toBeInTheDocument();
      expect(screen.getByText("Level: 2")).toBeInTheDocument();
      expect(screen.getByText("Level: 3")).toBeInTheDocument();
    });
  });

  describe("Remove functionality", () => {
    it("calls remove function with correct index when remove button is clicked", async () => {
      const user = userEvent.setup();
      const fields = createMockFields(3);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      // Click remove button for the second pair (index 1)
      const removeButton = screen.getByTestId("remove-pair-1");
      await user.click(removeButton);

      expect(remove).toHaveBeenCalledTimes(1);
      expect(remove).toHaveBeenCalledWith(1);
    });

    it("calls remove with correct indices for multiple remove operations", async () => {
      const user = userEvent.setup();
      const fields = createMockFields(5);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      // Click remove for index 0
      await user.click(screen.getByTestId("remove-pair-0"));
      expect(remove).toHaveBeenCalledWith(0);

      // Click remove for index 3
      await user.click(screen.getByTestId("remove-pair-3"));
      expect(remove).toHaveBeenCalledWith(3);

      expect(remove).toHaveBeenCalledTimes(2);
    });
  });

  describe("Error handling", () => {
    it("passes errors to PairFormRow components when provided", () => {
      const fields = createMockFields(2);
      const register = createMockRegister();
      const remove = vi.fn();
      const errors = [
        { term: { message: "Term is required", type: "required" }, definition: undefined },
        { term: undefined, definition: { message: "Definition is required", type: "required" } },
      ];

      render(<PairForm fields={fields} errors={errors} register={register} remove={remove} cardCount={16} />);

      // Component should still render the rows
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-1")).toBeInTheDocument();
    });

    it("handles empty errors array gracefully", () => {
      const fields = createMockFields(3);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} errors={[]} register={register} remove={remove} cardCount={16} />);

      expect(screen.getAllByTestId(/^pair-row-/)).toHaveLength(3);
    });

    it("handles undefined errors gracefully (default prop)", () => {
      const fields = createMockFields(2);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      expect(screen.getAllByTestId(/^pair-row-/)).toHaveLength(2);
    });
  });

  describe("Edge cases", () => {
    it("correctly displays level header at exact boundary (8th pair for cardCount=16)", () => {
      const fields = createMockFields(8);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      // Should only show Level 1 (indices 0-7)
      expect(screen.getByText("Level: 1")).toBeInTheDocument();
      expect(screen.queryByText("Level: 2")).not.toBeInTheDocument();
    });

    it("correctly displays level header at exact boundary (9th pair for cardCount=16)", () => {
      const fields = createMockFields(9);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      // Should show Level 1 (indices 0-7) and Level 2 (index 8)
      expect(screen.getByText("Level: 1")).toBeInTheDocument();
      expect(screen.getByText("Level: 2")).toBeInTheDocument();
    });

    it("renders correctly with a single field", () => {
      const fields = createMockFields(1);
      const register = createMockRegister();
      const remove = vi.fn();

      render(<PairForm fields={fields} register={register} remove={remove} cardCount={16} />);

      expect(screen.getByText("Level: 1")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
    });
  });
});
