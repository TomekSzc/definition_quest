interface GameMetaProps {
  timeSec: number;
  running: boolean;
  onStart(): void;
  onStop(): void;
  onReset(): void;
}

export default function GameMeta({ timeSec, running, onStart, onStop, onReset }: GameMetaProps) {
  const format = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <aside className="fixed right-0 w-[200px] shrink-0 border-l border-neutral-200 dark:border-neutral-700 p-4 flex flex-col gap-4">
      <div className="text-center text-3xl font-mono" aria-live="polite">
        {format(timeSec)}
      </div>
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
          className="bg-green-600 text-white rounded px-4 py-2"
          onClick={onStart}
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
