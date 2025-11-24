import { Loader2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectLoading } from "@/store/slices/uiSlice";

const LoaderOverlay = () => {
  const loading = useAppSelector(selectLoading);
  if (!loading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-white opacity-50" />
      {/* spinner */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin" />
      </div>
    </div>
  );
};

export default LoaderOverlay;
