import type { FC } from "react";
import { useGetBoardByIdQuery, useSubmitScoreMutation } from "@/store/api/apiSlice";
import { useBoardGame } from "@/lib/hooks/useBoardGame";
import GameMeta from "@/components/ui/GameMeta";
import BoardGrid from "@/components/ui/BoardGrid";
import SkeletonBoard from "@/components/ui/SkeletonBoard";
import { useToast } from "@/store/hooks";
import { withProviders } from "@/components/HOC/Providers";
import { useSidebar } from "@/hooks/useSidebar";

interface Props {
  boardId?: string;
}

const BoardGamePageComponent: FC<Props> = ({ boardId }) => {
  const { showToast } = useToast();
  if (!boardId) return <p className="p-4">Brak identyfikatora planszy</p>;

  const { data: board, isFetching, error } = useGetBoardByIdQuery(boardId);
  const [submitScore] = useSubmitScoreMutation();

  const onGameFinish = async (elapsedMs: number) => {
    try {
      await submitScore({ boardId, elapsedMs }).unwrap();
      showToast({ type: "success", title: "Sukces", message: "Wynik zapisany" });
    } catch {
      showToast({ type: "error", title: "Błąd", message: "Nie udało się zapisać wyniku" });
    }
  };

  const onGameTimeout = () =>
    showToast({ type: "warning", title: "Czas", message: "Czas minął" });

  const { collapsed } = useSidebar();
  const sidebarOffset = collapsed ? "ml-16" : "ml-64";

  const {
    state: { cards, statusMap, timeSec, running },
    startGame,
    stopGame,
    resetGame,
    markCard,
  } = useBoardGame(board, {
    onFinish: onGameFinish,
    onTimeout: onGameTimeout,
  });
  if (error) return <p className="p-4">Board not found</p>;

  return (
    <div className={`flex flex-wrap min-h-screen ${sidebarOffset}`}>
      {isFetching || !board ? (
        <SkeletonBoard cardCount={16} />
      ) : (
        <>
           <BoardGrid
            cards={cards.map((c, idx) => ({
              ...c,
              status: statusMap[idx] ?? "idle",
            }))}
            onCardClick={markCard}
          />
          <GameMeta
            timeSec={timeSec}
            running={running}
            onStart={startGame}
            onStop={stopGame}
            onReset={resetGame}
          />
        </>
      )}
    </div>
  );
};

export const BoardGamePage = withProviders(BoardGamePageComponent);
