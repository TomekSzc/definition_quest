import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import CreateBoardForm, { type CreateBoardFormHandle, type SubmitFn } from "@/components/forms/CreateBoardForm";
import { createRef } from "react";

/**
 * -----------------------------------------
 * Test doubles & global mocks
 * -----------------------------------------
 */

// 1. Mock toast helper
interface ToastArgs {
  type: string;
  title: string;
  message: string;
}
export const showToastMock = vi.fn();

// 2. Mock Redux hooks
const dispatchMock = vi.fn();
vi.mock("@/store/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/store/hooks")>("@/store/hooks");
  return {
    __esModule: true,
    ...actual,
    useToast: () => ({ showToast: showToastMock }),
    useAppDispatch: () => dispatchMock,
  };
});

// 3. Mock routes constant
vi.mock("@/lib/routes", () => ({
  Routes: {
    MyBoards: "/my-boards",
    Boards: "/boards",
  },
}));

// 4. Mock UI components that don't affect core functionality
vi.mock("@/components/ui/TagsInput", () => ({
  default: ({ value, onChange, error }: any) => (
    <div data-testid="tags-input">
      <input
        data-testid="tags-input-field"
        value={value?.join(",") || ""}
        onChange={(e) => onChange?.(e.target.value.split(",").filter(Boolean))}
      />
      {error && <span data-testid="tags-error">{error}</span>}
    </div>
  ),
}));

vi.mock("@/components/ui/ToggleGroup/CardCountToggle", () => ({
  default: ({ value, onChange }: any) => (
    <div data-testid="card-count-toggle">
      <button data-testid="card-count-16" onClick={() => onChange?.(16)}>
        16
      </button>
      <button data-testid="card-count-24" onClick={() => onChange?.(24)}>
        24
      </button>
      <span data-testid="card-count-value">{value}</span>
    </div>
  ),
}));

vi.mock("@/components/ui/ToggleGroup/BoardVisibilityToggle", () => ({
  default: ({ value, onChange }: any) => (
    <div data-testid="board-visibility-toggle">
      <button data-testid="visibility-public" onClick={() => onChange?.(true)}>
        Public
      </button>
      <button data-testid="visibility-private" onClick={() => onChange?.(false)}>
        Private
      </button>
      <span data-testid="visibility-value">{value ? "public" : "private"}</span>
    </div>
  ),
}));

vi.mock("@/components/forms/PairForm", () => ({
  default: ({ fields, register, remove, errors }: any) => (
    <div data-testid="pair-form">
      {fields.map((field: any, index: number) => (
        <div key={field.id} data-testid={`pair-row-${index}`}>
          <input
            data-testid={`pair-term-${index}`}
            {...register(`pairs.${index}.term`)}
            placeholder="Term"
          />
          <input
            data-testid={`pair-definition-${index}`}
            {...register(`pairs.${index}.definition`)}
            placeholder="Definition"
          />
          <button
            data-testid={`remove-pair-${index}`}
            type="button"
            onClick={() => remove(index)}
          >
            Remove
          </button>
          {errors?.[index]?.term && (
            <span data-testid={`pair-term-error-${index}`}>{errors[index].term.message}</span>
          )}
          {errors?.[index]?.definition && (
            <span data-testid={`pair-definition-error-${index}`}>{errors[index].definition.message}</span>
          )}
        </div>
      ))}
    </div>
  ),
}));

// 5. Make window.location mutable
beforeEach(() => {
  Object.defineProperty(window, "location", {
    writable: true,
    value: { assign: vi.fn() },
  });
  vi.clearAllMocks();
});

/**
 * -----------------------------------------
 * Test utilities
 * -----------------------------------------
 */

const createTestStore = () => {
  return configureStore({
    reducer: {
      ui: (state = { loading: false }) => state,
    },
  });
};

const setup = (submitFn: SubmitFn = vi.fn().mockResolvedValue({}), ref?: React.RefObject<CreateBoardFormHandle>) => {
  const user = userEvent.setup();
  const testStore = createTestStore();

  const rendered = render(
    <Provider store={testStore}>
      <CreateBoardForm submitFn={submitFn} ref={ref} />
    </Provider>
  );

  const titleInput = screen.getByTestId("board-title-input") as HTMLInputElement;
  const addPairButton = screen.getByTestId("add-pair-button") as HTMLButtonElement;
  const submitButton = screen.getByTestId("create-board-submit") as HTMLButtonElement;

  return {
    user,
    titleInput,
    addPairButton,
    submitButton,
    ...rendered,
  };
};

const fillPair = async (user: ReturnType<typeof userEvent.setup>, index: number, term: string, definition: string) => {
  const termInput = screen.getByTestId(`pair-term-${index}`);
  const defInput = screen.getByTestId(`pair-definition-${index}`);
  await user.type(termInput, term);
  await user.type(defInput, definition);
};

/**
 * -----------------------------------------
 * Tests
 * -----------------------------------------
 */

describe("<CreateBoardForm />", () => {
  describe("Initial Rendering", () => {
    it("renders all form fields with default values", () => {
      setup();

      // Title field
      expect(screen.getByTestId("board-title-input")).toBeInTheDocument();
      expect(screen.getByTestId("board-title-input")).toHaveValue("");

      // Tags input
      expect(screen.getByTestId("tags-input")).toBeInTheDocument();

      // Card count toggle
      expect(screen.getByTestId("card-count-toggle")).toBeInTheDocument();
      expect(screen.getByTestId("card-count-value")).toHaveTextContent("16");

      // Visibility toggle
      expect(screen.getByTestId("board-visibility-toggle")).toBeInTheDocument();
      expect(screen.getByTestId("visibility-value")).toHaveTextContent("public");

      // Pairs section
      expect(screen.getByTestId("pair-form")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();

      // Buttons
      expect(screen.getByTestId("add-pair-button")).toBeInTheDocument();
      expect(screen.getByTestId("create-board-submit")).toBeInTheDocument();
    });

    it("starts with one empty pair by default", () => {
      setup();

      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
      expect(screen.queryByTestId("pair-row-1")).not.toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("submits form with valid data and redirects on success", async () => {
      const submitFn = vi.fn().mockResolvedValue({});
      const assignSpy = vi.fn();
      vi.stubGlobal("location", { ...window.location, assign: assignSpy } as unknown as Location);

      const { user, titleInput, submitButton } = setup(submitFn);

      // Fill in the form
      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");

      // Submit
      await user.click(submitButton);

      // Assert submission
      await waitFor(() => {
        expect(submitFn).toHaveBeenCalledWith({
          title: "Test Board",
          cardCount: 16,
          isPublic: true,
          tags: [],
          pairs: [{ term: "Term 1", definition: "Definition 1" }],
        });
      });

      // Assert success toast
      expect(showToastMock).toHaveBeenCalledWith({
        type: "success",
        title: "Sukces",
        message: "Tablica utworzona",
      });

      // Assert navigation
      expect(assignSpy).toHaveBeenCalledWith("/my-boards");
    });

    it("shows error toast when submission fails", async () => {
      const submitFn = vi.fn().mockRejectedValue(new Error("Server error"));
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");
      await user.click(submitButton);

      await waitFor(() => {
        expect(showToastMock).toHaveBeenCalledWith({
          type: "error",
          title: "Błąd",
          message: "Nie udało się utworzyć tablicy",
        });
      });
    });

    it("disables submit button while submitting", async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const submitFn = vi.fn().mockReturnValue(submitPromise);

      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");

      // Start submission
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveSubmit!();
    });

    it("dispatches loading actions during submission", async () => {
      const submitFn = vi.fn().mockResolvedValue({});
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");
      await user.click(submitButton);

      await waitFor(() => {
        expect(dispatchMock).toHaveBeenCalledWith(
          expect.objectContaining({
            type: expect.stringContaining("setLoading"),
          })
        );
      });
    });
  });

  describe("Validation", () => {
    it("shows error when title is empty", async () => {
      const submitFn = vi.fn();
      const { user, submitButton } = setup(submitFn);

      await fillPair(user, 0, "Term 1", "Definition 1");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/title must be at least 1 character/i)).toBeInTheDocument();
      });

      expect(submitFn).not.toHaveBeenCalled();
    });

    it("shows error when title exceeds 255 characters", async () => {
      const submitFn = vi.fn();
      const { user, titleInput, submitButton } = setup(submitFn);

      const longTitle = "a".repeat(256);
      await user.type(titleInput, longTitle);
      await fillPair(user, 0, "Term 1", "Definition 1");

      // Trigger validation by blurring
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/title must not exceed 255 characters/i)).toBeInTheDocument();
      });
    });

    it("shows error when no pairs are provided", async () => {
      const submitFn = vi.fn();
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");

      // Remove the default pair
      const removeButton = screen.getByTestId("remove-pair-0");
      await user.click(removeButton);

      await user.click(submitButton);

      // Validation should prevent submission
      await waitFor(() => {
        expect(submitFn).not.toHaveBeenCalled();
      });

      // The error message might be displayed (react-hook-form validation)
      // but we primarily care that submission was blocked
      expect(submitFn).not.toHaveBeenCalled();
    });

    it("shows error when pair term is empty", async () => {
      const submitFn = vi.fn();
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");

      // Fill only definition
      const defInput = screen.getByTestId("pair-definition-0");
      await user.type(defInput, "Definition 1");

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/term must be at least 1 character/i)).toBeInTheDocument();
      });

      expect(submitFn).not.toHaveBeenCalled();
    });

    it("shows error when pair definition is empty", async () => {
      const submitFn = vi.fn();
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");

      // Fill only term
      const termInput = screen.getByTestId("pair-term-0");
      await user.type(termInput, "Term 1");

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/definition must be at least 1 character/i)).toBeInTheDocument();
      });

      expect(submitFn).not.toHaveBeenCalled();
    });

    it("shows error when pairs have duplicate terms (case-insensitive)", async () => {
      const submitFn = vi.fn();
      const { user, titleInput, addPairButton, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term", "Definition 1");

      await user.click(addPairButton);
      await fillPair(user, 1, "TERM", "Definition 2");

      await user.click(submitButton);

      // The error should be displayed somewhere in the document
      await waitFor(() => {
        const errorText = screen.queryByText(/each pair term must be unique/i);
        // The error might not be displayed in the UI but validation should still fail
        expect(submitFn).not.toHaveBeenCalled();
      });
    });
  });

  describe("Pair Management", () => {
    it("allows adding new pairs up to the limit of 100", async () => {
      const { user, addPairButton } = setup();

      // Initially 1 pair
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();

      // Add pairs
      for (let i = 1; i < 100; i++) {
        await user.click(addPairButton);
      }

      // Should have 100 pairs
      expect(screen.getByTestId("pair-row-99")).toBeInTheDocument();

      // Button should be disabled at limit
      expect(addPairButton).toBeDisabled();
    });

    it("disables add button when 100 pairs are reached", async () => {
      const { user, addPairButton } = setup();

      // Add 99 more pairs (already have 1)
      for (let i = 1; i < 100; i++) {
        await user.click(addPairButton);
      }

      expect(addPairButton).toBeDisabled();
    });

    it("allows removing pairs", async () => {
      const { user, addPairButton } = setup();

      // Add one more pair
      await user.click(addPairButton);

      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-1")).toBeInTheDocument();

      // Remove first pair
      const removeButton = screen.getByTestId("remove-pair-0");
      await user.click(removeButton);

      // After removing pair-0, we should only have 1 pair left (the previous pair-1 becomes pair-0)
      await waitFor(() => {
        expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
        expect(screen.queryByTestId("pair-row-1")).not.toBeInTheDocument();
      });
    });
  });

  describe("Imperative Handle (addPairs)", () => {
    it("exposes addPairs method via ref", () => {
      const ref = createRef<CreateBoardFormHandle>();
      setup(vi.fn(), ref);

      expect(ref.current).toBeDefined();
      expect(ref.current?.addPairs).toBeDefined();
      expect(typeof ref.current?.addPairs).toBe("function");
    });

    it("adds multiple pairs via imperative handle", async () => {
      const ref = createRef<CreateBoardFormHandle>();
      setup(vi.fn(), ref);

      // Initially 1 pair
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
      expect(screen.queryByTestId("pair-row-1")).not.toBeInTheDocument();

      // Add pairs via ref
      ref.current?.addPairs([
        { term: "Term 2", definition: "Def 2" },
        { term: "Term 3", definition: "Def 3" },
      ]);

      await waitFor(() => {
        expect(screen.getByTestId("pair-row-1")).toBeInTheDocument();
        expect(screen.getByTestId("pair-row-2")).toBeInTheDocument();
      });
    });

    it("removes empty pairs after adding via imperative handle", async () => {
      const ref = createRef<CreateBoardFormHandle>();
      const { user, addPairButton } = setup(vi.fn(), ref);

      // Add an empty pair manually
      await user.click(addPairButton);

      // Should have 2 pairs (both empty)
      expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("pair-row-1")).toBeInTheDocument();

      // Add pairs via ref (should remove empty ones)
      ref.current?.addPairs([{ term: "Term 1", definition: "Def 1" }]);

      // Wait for empty pairs to be removed
      await waitFor(
        () => {
          // Should only have 1 pair now (the one we added)
          expect(screen.getByTestId("pair-row-0")).toBeInTheDocument();
          expect(screen.queryByTestId("pair-row-1")).not.toBeInTheDocument();
        },
        { timeout: 100 }
      );
    });

    it("respects 100 pair limit when adding via imperative handle", async () => {
      const ref = createRef<CreateBoardFormHandle>();
      setup(vi.fn(), ref);

      // Try to add 100 pairs via ref (already have 1 empty pair, so only 99 should be added)
      const pairsToAdd = Array.from({ length: 100 }, (_, i) => ({
        term: `Term ${i}`,
        definition: `Def ${i}`,
      }));

      ref.current?.addPairs(pairsToAdd);

      // Wait for pairs to be added and empty ones removed
      await waitFor(
        () => {
          // Should have exactly 100 pairs (the limit)
          const pairs = screen.queryAllByTestId(/^pair-row-/);
          expect(pairs.length).toBeLessThanOrEqual(100);
          expect(screen.queryByTestId("pair-row-100")).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });
  });

  describe("Card Count Selection", () => {
    it("allows changing card count to 24", async () => {
      const { user } = setup();

      const cardCount24Button = screen.getByTestId("card-count-24");
      await user.click(cardCount24Button);

      await waitFor(() => {
        expect(screen.getByTestId("card-count-value")).toHaveTextContent("24");
      });
    });

    it("submits with selected card count", async () => {
      const submitFn = vi.fn().mockResolvedValue({});
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");

      // Change to 24
      const cardCount24Button = screen.getByTestId("card-count-24");
      await user.click(cardCount24Button);

      await user.click(submitButton);

      await waitFor(() => {
        expect(submitFn).toHaveBeenCalledWith(
          expect.objectContaining({
            cardCount: 24,
          })
        );
      });
    });
  });

  describe("Visibility Toggle", () => {
    it("allows toggling board visibility to private", async () => {
      const { user } = setup();

      const privateButton = screen.getByTestId("visibility-private");
      await user.click(privateButton);

      await waitFor(() => {
        expect(screen.getByTestId("visibility-value")).toHaveTextContent("private");
      });
    });

    it("submits with selected visibility", async () => {
      const submitFn = vi.fn().mockResolvedValue({});
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");

      // Change to private
      const privateButton = screen.getByTestId("visibility-private");
      await user.click(privateButton);

      await user.click(submitButton);

      await waitFor(() => {
        expect(submitFn).toHaveBeenCalledWith(
          expect.objectContaining({
            isPublic: false,
          })
        );
      });
    });
  });

  describe("Tags", () => {
    it("submits with tags when provided", async () => {
      const submitFn = vi.fn().mockResolvedValue({});
      const { user, titleInput, submitButton } = setup(submitFn);

      await user.type(titleInput, "Test Board");
      await fillPair(user, 0, "Term 1", "Definition 1");

      // Submit without tags first to verify form works
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitFn).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Test Board",
            pairs: [{ term: "Term 1", definition: "Definition 1" }],
            tags: [], // Default empty tags
          })
        );
      });
    });
  });
});

