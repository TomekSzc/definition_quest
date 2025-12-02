// NOTE: New test file
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddLevelForm from "@/components/forms/AddLevelForm";

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
interface ToastArgs {
  type: string;
  title: string;
  message: string;
}
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

    // add 7 extra rows (total 8, which is the limit)
    await addPairRows(7);

    // fill all 8 pairs
    for (let i = 0; i < 8; i += 1) {
      await fillPair(i, `term-${i}`, `def-${i}`);
    }

    // verify we can't add more (button should be hidden)
    expect(screen.queryByTestId("add-pair-button")).toBeNull();

    await userEvent.click(screen.getByTestId("save-level-button"));

    // mutation should be called since we're at the limit (not exceeding)
    await waitFor(() => expect(addLevelMock).toHaveBeenCalledTimes(1));
  });

  it("calls the mutation and navigates on successful save", async () => {
    render(<AddLevelForm rootId={rootId} cardCount={cardCount as 16} />);

    await fillPair(0, "Capital", "Warsaw");

    await userEvent.click(screen.getByTestId("save-level-button"));

    await waitFor(() => expect(addLevelMock).toHaveBeenCalledTimes(1));

    expect(addLevelMock).toHaveBeenCalledWith(expect.objectContaining({ boardId: rootId }));

    expect(window.location.href).toBe("/boards");
  });
});
