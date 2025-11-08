import type { FC } from "react";

export const VolumeOnIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.25-3.9v7.8A4.5 4.5 0 0 0 16.5 12zm-2.25-7.94v2.14a6.75 6.75 0 0 1 0 13.6v2.14c4.4-1 7.5-4.9 7.5-9.89s-3.1-8.88-7.5-9.99z" />
  </svg>
);

export default VolumeOnIcon;
