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
  levels?: number[];
  currentLevel?: number;
  navigateToLevel?: (level: number) => void;
}

export const GameMeta: FC<IGameMetaProps> = ({
  timeSec,
  running,
  canStart,
  lastScore,
  onStart,
  onStop,
  onReset,
  levels = [],
  currentLevel,
  navigateToLevel,
}) => {
  const { soundOn, handleSound } = useBoardSound();

  const format = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    const h = Math.floor(sec / 3600)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <aside className="fixed bottom-0 left-0 w-full p-4 shrink-0 flex flex-row justify-center md:flex-col gap-4 bg-[var(--color-primary)] md:top-[0px] md:right-0 md:left-auto md:bottom-auto md:w-[199px] md:h-full md:justify-start md:pt-[80px] z-[1]">
      <div className="flex justify-center">
        <button className="self-end mb-2 cursor-pointer" onClick={handleSound} aria-label="Toggle sound">
          {soundOn ? <VolumeOnIcon className="w-6 h-6" /> : <VolumeOffIcon className="w-6 h-6" />}
        </button>
      </div>
      <div className="text-center text-3xl font-mono" aria-live="polite">
        {format(timeSec)}
      </div>
      {lastScore !== undefined && (
        <div className="text-center text-sm mt-2 hidden md:block">
          Ostatni wynik: {format(Math.floor(lastScore / 1000))}
        </div>
      )}
      {running ? (
        <button
          className="cursor-pointer bg-red-600 text-white rounded px-4 py-2 disabled:opacity-50"
          onClick={onStop}
          aria-label="Stop game"
        >
          Stop
        </button>
      ) : (
        <button
          className="cursor-pointer bg-green-600 text-white rounded px-4 py-2 disabled:opacity-50 font-bold hover:bg-white hover:text-[var(--color-primary)]"
          onClick={onStart}
          disabled={!canStart}
          aria-label="Start game"
        >
          Start
        </button>
      )}
      <button
        className="cursor-pointer border-2 border-white rounded px-4 py-2 font-bold disabled:opacity-50 hover:bg-white hover:text-[var(--color-primary)]"
        onClick={onReset}
        disabled={running === false && timeSec === 0}
        aria-label="Reset game"
      >
        Reset
      </button>
      {levels.length > 1 && (
        <div className="hidden md:block">
          <div className="text-center font-semibold">Poziomy</div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {levels.map((l: number) => (
              <button
                key={l}
                className="cursor-pointer border border-neutral-400 rounded px-2 py-1 text-sm disabled:opacity-50"
                disabled={l === currentLevel}
                onClick={() => navigateToLevel?.(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

export default GameMeta;
