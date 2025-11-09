import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSound } from "@/store/slices/soundSlice";

let successAudio: HTMLAudioElement | undefined;
let failureAudio: HTMLAudioElement | undefined;
let fanfareAudio: HTMLAudioElement | undefined;

if (typeof window !== "undefined") {
  successAudio = new Audio("/sounds/success.mp3");
  failureAudio = new Audio("/sounds/failure.mp3");
  fanfareAudio = new Audio("/sounds/fanfare.mp3");
}

export function useBoardSound() {
  const soundOn = useAppSelector((s: any) => s.sound?.soundOn ?? true);
  const dispatch = useAppDispatch();

  const stopAll = () => {
    [successAudio, failureAudio, fanfareAudio].forEach(a => {
      if (a && !a.paused) {
        a.pause();
        a.currentTime = 0;
      }
    });
  };

  const play = (audio?: HTMLAudioElement) => {
    if (!soundOn || !audio) return;
    stopAll();
    audio.play().catch(() => {});
  };

  const playSuccess = () => play(successAudio);
  const playFailure = () => play(failureAudio);
  const playFanfare = () => play(fanfareAudio);
  const handleSound = () => dispatch(toggleSound());

  return { soundOn, playSuccess, playFailure, playFanfare, handleSound } as const;
}
