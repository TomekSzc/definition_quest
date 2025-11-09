import type { FC } from "react";
import { VolumeOnIcon, VolumeOffIcon } from "@/assets/icons";
import { useBoardSound } from "@/hooks/useBoardSound";

interface IGameMetaProps {
  timeSec: number;
  running: boolean;
  canStart: boolean;
  lastScore?: number;
  onStart(): void;
  onStop(): void;
  onReset(): void;
}

export const GameMeta: FC<IGameMetaProps> = ({ timeSec, running, canStart, lastScore, onStart, onStop, onReset }) => {
  const { soundOn, handleSound } = useBoardSound();

  const format = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    const h = Math.floor(sec / 3600).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <aside className="fixed right-0 bottom-14 w-[200px] shrink-0 border-l border-neutral-200 dark:border-neutral-700 p-4 flex flex-col gap-4">
      <div className="flex justify-center">
        <button className="self-end mb-2 cursor-pointer" onClick={handleSound} aria-label="Toggle sound">
          {soundOn ? <VolumeOnIcon className="w-6 h-6" /> : <VolumeOffIcon className="w-6 h-6" />}
        </button>
      </div>
      <div className="text-center text-3xl font-mono" aria-live="polite">
        {format(timeSec)}
      </div>
      {lastScore !== undefined && (
        <div className="text-center text-sm mt-2">
          Ostatni wynik: {format(Math.floor(lastScore / 1000))}
        </div>
      )}
      {running ? (
        <button
          className="bg-red-600 text-white rounded px-4 py-2 disabled:opacity-50"
          onClick={onStop}
          aria-label="Stop game"
        >
          Stop
        </button>
      ) : (
        <button
          className="bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50"
          onClick={onStart}
          disabled={!canStart}
          aria-label="Start game"
        >
          Start
        </button>
      )}
      <button
        className="border border-neutral-400 rounded px-4 py-2 disabled:opacity-50"
        onClick={onReset}
        disabled={running === false && timeSec === 0}
        aria-label="Reset game"
      >
        Reset
      </button>
    </aside>
  );
}

export default GameMeta;