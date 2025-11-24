import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const CloseIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={cn("w-4 h-4", className)} {...props}>
    <path
      fillRule="evenodd"
      d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.5l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.561l-4.715 4.713a.75.75 0 11-1.06-1.06L10.94 10.5 6.225 5.786a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

export default CloseIcon;
