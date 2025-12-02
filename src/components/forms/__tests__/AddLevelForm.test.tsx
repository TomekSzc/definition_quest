// NOTE: New test file
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddLevelForm from "../AddLevelForm";

/**
 * -----------------------------------------
 * Test doubles & global mocks
 * -----------------------------------------
 */

// 1. Mock RTK-Query mutation hook
const addLevelMock = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });
vi.mock("@/store/api/apiSlice", () => ({
  useAddLevelMutation: () => [addLevelMock],
}));

// 2. Mock toast helper
type ToastArgs = { type: string; title: string; message: string };
export const showToastMock = vi.fn();
vi.mock("@/store/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/store/hooks")>("@/store/hooks");
  return {
    __esModule: true,
    ...actual,
    useToast: () => ({ showToast: showToastMock }),
    useAppDispatch: () => vi.fn(),
  };
});

// 3. Mock routes constant
vi.mock("@/lib/routes", () => ({
  Routes: { Boards: "/boards" },
}));

// 4. Make window.location mutable so we can assert navigation
beforeEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { href: "" },
  });
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Utility helpers
 */
const addPairRows = async (count: number) => {
  const addPairBtn = screen.getByTestId("add-pair-button");
  for (let i = 0; i < count; i += 1) {
    if (!addPairBtn) break;
    await userEvent.click(addPairBtn);
  }
};

const fillPair = async (index: number, term: string, definition: string) => {
  const termInput = screen.getByTestId(`pair-term-${index}`);
  const defInput = screen.getByTestId(`pair-definition-${index}`);
  await userEvent.type(termInput, term);
  await userEvent.type(defInput, definition);
};

describe("AddLevelForm", () => {
  const rootId = "root-123";
  const cardCount = 16; // -> max 8 pairs

  it("allows adding new pairs up to the card limit", async () => {
    render(<AddLevelForm rootId={rootId} cardCount={cardCount as 16} />);

    // initial single row should be present
    expect(screen.getAllByTestId(/^pair-row-/)).toHaveLength(1);

    // add pairs up to the limit (7 more, total 8 rows)
    await addPairRows(7);

    expect(screen.getAllByTestId(/^pair-row-/)).toHaveLength(8);

    // the add button should no longer be rendered once limit reached
    expect(screen.queryByTestId("add-pair-button")).toBeNull();
  });

  it("shows an error toast when submitting with too many pairs", async () => {
    render(<AddLevelForm rootId={rootId} cardCount={cardCount as 16} />);

    // add 8 extra rows so we exceed limit (total 9)
    await addPairRows(8);

    // fill minimal content so validation passes other rules
    for (let i = 0; i < 9; i += 1) {
      await fillPair(i, `term-${i}`, `def-${i}`);
    }

    await userEvent.click(screen.getByTestId("save-level-button"));

    // toast called with error object
    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
    });

    // mutation NOT called
    expect(addLevelMock).not.toHaveBeenCalled();
  });

  it("calls the mutation and navigates on successful save", async () => {
    render(<AddLevelForm rootId={rootId} cardCount={cardCount as 16} />);

    await fillPair(0, "Capital", "Warsaw");

    await userEvent.click(screen.getByTestId("save-level-button"));

    await waitFor(() => expect(addLevelMock).toHaveBeenCalledTimes(1));

    expect(addLevelMock).toHaveBeenCalledWith(
      expect.objectContaining({ boardId: rootId })
    );

    expect(window.location.href).toBe("/boards");
  });
});
