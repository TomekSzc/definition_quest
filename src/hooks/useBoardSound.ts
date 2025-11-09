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

  const playSuccess = () => {
    if (soundOn && successAudio) successAudio.play().catch(() => {});
  };
  const playFailure = () => {
    if (soundOn && failureAudio) failureAudio.play().catch(() => {});
  };
  const playFanfare = () => {
    if (soundOn && fanfareAudio) fanfareAudio.play().catch(() => {});
  };
  const handleSound = () => dispatch(toggleSound());

  return { soundOn, playSuccess, playFailure, playFanfare, handleSound } as const;
}
