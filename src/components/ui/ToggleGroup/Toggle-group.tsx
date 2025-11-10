import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export const ToggleGroup = ToggleGroupPrimitive.Root;

export const ToggleGroupItem = ({ className, ...props }: ToggleGroupPrimitive.ToggleGroupItemProps) => (
  <ToggleGroupPrimitive.Item
    className={cn(
      "px-4 py-2 border rounded-md text-sm font-bold data-[state=on]:bg-[var(--color-primary)] data-[state=off]:text-[var(--color-primary)] data-[state=on]:text-white transition-colors cursor-pointer",
      className
    )}
    {...props}
  />
);
