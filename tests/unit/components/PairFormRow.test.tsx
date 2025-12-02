import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { UseFormRegister, FieldError } from "react-hook-form";
import PairFormRow from "@/components/forms/PairFormRow";
import type { CreateBoardFormValues } from "@/components/forms/CreateBoardForm";

/**
 * -----------------------------------------
 * Test doubles & mocks
 * -----------------------------------------
 */

// Mock the Button component from shadcn/ui
vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, onClick, "data-testid": dataTestId, className, type, variant }: any) => (
    <button
      data-testid={dataTestId}
      onClick={onClick}
      className={className}
      type={type}
      data-variant={variant}
    >
      {children}
    </button>
  ),
}));

/**
 * -----------------------------------------
 * Utility helpers
 * -----------------------------------------
 */

const createMockRegister = (): UseFormRegister<CreateBoardFormValues> => {
  const mockRegister = vi.fn((name: string) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  }));
  return mockRegister as unknown as UseFormRegister<CreateBoardFormValues>;
};

const createFieldError = (message: string): FieldError => ({
  type: "required",
  message,
  ref: undefined,
});

/**
 * -----------------------------------------
 * Tests
 * -----------------------------------------
 */

describe("PairFormRow", () => {
  let mockRegister: UseFormRegister<CreateBoardFormValues>;
  let mockOnRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRegister = createMockRegister();
    mockOnRemove = vi.fn();
  });

  it("renders both term and definition inputs with correct placeholders", () => {
    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const termInput = screen.getByPlaceholderText("Słowo");
    const definitionInput = screen.getByPlaceholderText("Definicja");

    expect(termInput).toBeInTheDocument();
    expect(definitionInput).toBeInTheDocument();
  });

  it("renders with correct testid for the row container", () => {
    render(
      <PairFormRow
        index={3}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByTestId("pair-row-3")).toBeInTheDocument();
  });

  it("renders term and definition inputs with correct testids based on index", () => {
    render(
      <PairFormRow
        index={2}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByTestId("pair-term-2")).toBeInTheDocument();
    expect(screen.getByTestId("pair-definition-2")).toBeInTheDocument();
  });

  it("renders remove button with correct testid", () => {
    render(
      <PairFormRow
        index={1}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByTestId("remove-pair-1")).toBeInTheDocument();
  });

  it("calls register with correct field names for term and definition", () => {
    render(
      <PairFormRow
        index={4}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    expect(mockRegister).toHaveBeenCalledWith("pairs.4.term");
    expect(mockRegister).toHaveBeenCalledWith("pairs.4.definition");
  });

  it("calls onRemove callback when remove button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByTestId("remove-pair-0");
    await user.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalledTimes(1);
  });

  it("displays error message for term when term error is provided", () => {
    const termError = createFieldError("Term is required");

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        errors={{ term: termError }}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("Term is required")).toBeInTheDocument();
  });

  it("displays error message for definition when definition error is provided", () => {
    const definitionError = createFieldError("Definition is required");

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        errors={{ definition: definitionError }}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("Definition is required")).toBeInTheDocument();
  });

  it("displays both error messages when both term and definition have errors", () => {
    const termError = createFieldError("Term is required");
    const definitionError = createFieldError("Definition is required");

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        errors={{ term: termError, definition: definitionError }}
        onRemove={mockOnRemove}
      />
    );

    expect(screen.getByText("Term is required")).toBeInTheDocument();
    expect(screen.getByText("Definition is required")).toBeInTheDocument();
  });

  it("applies error styling to term input when term error exists", () => {
    const termError = createFieldError("Term is required");

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        errors={{ term: termError }}
        onRemove={mockOnRemove}
      />
    );

    const termInput = screen.getByTestId("pair-term-0");
    expect(termInput.className).toContain("border-red-500");
  });

  it("applies error styling to definition input when definition error exists", () => {
    const definitionError = createFieldError("Definition is required");

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        errors={{ definition: definitionError }}
        onRemove={mockOnRemove}
      />
    );

    const definitionInput = screen.getByTestId("pair-definition-0");
    expect(definitionInput.className).toContain("border-red-500");
  });

  it("applies primary border styling when no errors exist", () => {
    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const termInput = screen.getByTestId("pair-term-0");
    const definitionInput = screen.getByTestId("pair-definition-0");

    expect(termInput.className).toContain("border-[var(--color-primary)]");
    expect(definitionInput.className).toContain("border-[var(--color-primary)]");
  });

  it("renders remove button with destructive variant", () => {
    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByTestId("remove-pair-0");
    expect(removeButton).toHaveAttribute("data-variant", "destructive");
  });

  it("renders remove button as type button to prevent form submission", () => {
    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const removeButton = screen.getByTestId("remove-pair-0");
    expect(removeButton).toHaveAttribute("type", "button");
  });

  it("does not display error messages when no errors are provided", () => {
    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const errorMessages = screen.queryAllByText(/required/i);
    expect(errorMessages).toHaveLength(0);
  });

  it("allows user to type in term input", async () => {
    const user = userEvent.setup();

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const termInput = screen.getByTestId("pair-term-0") as HTMLInputElement;
    await user.type(termInput, "Test term");

    expect(termInput.value).toBe("Test term");
  });

  it("allows user to type in definition input", async () => {
    const user = userEvent.setup();

    render(
      <PairFormRow
        index={0}
        register={mockRegister}
        onRemove={mockOnRemove}
      />
    );

    const definitionInput = screen.getByTestId("pair-definition-0") as HTMLInputElement;
    await user.type(definitionInput, "Test definition");

    expect(definitionInput.value).toBe("Test definition");
  });
});

