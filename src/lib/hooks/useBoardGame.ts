import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BoardViewDTO } from "../../types";
import { useBoardSound } from "@/hooks/useBoardSound";

export type CardStatus = "idle" | "selected" | "success" | "failure";

export interface CardVM {
  value: string;
  pairId: string;
}

export interface GameState {
  cards: CardVM[];
  statusMap: Record<number, CardStatus>;
  selectedIndices: number[];
  timeSec: number;
  running: boolean;
}

export interface UseBoardGame {
  state: GameState;
  startGame(): void;
  stopGame(): void;
  resetGame(): void;
  markCard(index: number): void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useBoardGame(
  board: BoardViewDTO | null | undefined,
  callbacks?: {
    onFinish?: (elapsedMs: number) => void;
    onTimeout?: () => void;
  }
): UseBoardGame {
  const initialCards = useMemo<CardVM[]>(() => {
    if (!board) return [];
    const flat: CardVM[] = board.pairs.flatMap(({ id, term, definition }) => [
      { value: term, pairId: id },
      { value: definition, pairId: id },
    ]);
    return shuffle(flat);
  }, [board]);

  const [cards, setCards] = useState<CardVM[]>(initialCards);
  const [statusMap, setStatusMap] = useState<Record<number, CardStatus>>({});
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [timeSec, setTimeSec] = useState(0);
  const [running, setRunning] = useState(false);

  const timerRef = useRef<number | null>(null);
  const gameStartRef = useRef<number | null>(null);

  // Helper: clear timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Timer tick
  const tick = useCallback(() => {
    setTimeSec(prev => prev + 1);
  }, []);

  // Public controls
  const startGame = useCallback(() => {
    if (running) return;
    setRunning(true);
    gameStartRef.current = Date.now();
    timerRef.current = window.setInterval(tick, 1000);
  }, [running, tick]);

  const stopGame = useCallback(() => {
    setRunning(false);
    clearTimer();
  }, [clearTimer]);

  const { playSuccess, playFailure } = useBoardSound();

  const submitScore = useCallback(() => {
    if (!board) return;
    const elapsedMs = timeSec * 1000;
    callbacks?.onFinish?.(elapsedMs);
  }, [board, timeSec, callbacks]);

  const resetGame = useCallback(() => {
    stopGame();
    setTimeSec(0);
    setStatusMap({});
    setSelectedIndices([]);
    setCards(initialCards);
  }, [stopGame, initialCards]);

  // Refresh cards when board (initialCards) changes
  useEffect(() => {
    setCards(initialCards);
    setStatusMap({});
    setSelectedIndices([]);
    setTimeSec(0);
    setRunning(false);
    clearTimer();
  }, [initialCards]);

  // Guard timer for 10-min limit
  useEffect(() => {
    const tenMin = 10 * 60;
    if (running && timeSec >= tenMin) {
      stopGame();
      callbacks?.onTimeout?.();
    }
  }, [running, timeSec, stopGame, callbacks]);

  // Clear interval on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  // Helper to resolve pair match logic
  const checkPairs = useCallback(
    (i1: number, i2: number) => {
      const success = cards[i1].pairId === cards[i2].pairId;
      if (success) {
        setStatusMap(s => ({ ...s, [i1]: "success", [i2]: "success" }));
        playSuccess();
        const pairId = cards[i1].pairId;
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.filter(card => card.pairId !== pairId);
            if (updated.length === 0) {
              stopGame();
              submitScore();
            }
            return updated;
          });
          setStatusMap(s => {
            const { [i1]: _, [i2]: __, ...rest } = s;
            return rest;
          });
          setSelectedIndices([]);
        }, 500);
      } else {
        setStatusMap(s => ({ ...s, [i1]: "failure", [i2]: "failure" }));
        playFailure();
        setTimeout(() => {
          setStatusMap(s => {
            const copy = { ...s };
            delete copy[i1];
            delete copy[i2];
            return copy;
          });
          setSelectedIndices([]);
        }, 500);
      }
    },
    [cards, stopGame, submitScore, callbacks]
  );

  // Mark card
  const markCard = useCallback(
    (index: number) => {
      if (!running) return;
      if (statusMap[index] === "success" || statusMap[index] === "failure") return;

      setSelectedIndices(prev => {
        let next = prev;
        // toggle selection
        if (prev.includes(index)) {
          next = prev.filter(i => i !== index);
        } else if (prev.length < 2) {
          next = [...prev, index];
          setStatusMap(s => ({ ...s, [index]: "selected" }));
        }

        // After updating next, if 2 selected, check pairs
        if (next.length === 2) {
          const [i1, i2] = next;
          checkPairs(i1, i2);
        }
        return next;
      });
    },
    [running, statusMap, checkPairs]
  );

  return {
    state: {
      cards,
      selectedIndices,
      statusMap,
      timeSec,
      running,
    },
    startGame,
    stopGame,
    resetGame,
    markCard,
  };
}
