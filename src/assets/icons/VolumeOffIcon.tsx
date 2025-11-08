import type { FC } from "react";

export const VolumeOffIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M16.5 12a4.5 4.5 0 0 1-2.25 3.9v-7.8A4.5 4.5 0 0 1 16.5 12zM3 9v6h4l5 5V4L7 9H3zm15.46 9.88l-1.27-1.27C18.62 15.6 19.5 13.87 19.5 12c0-2.7-1.47-5.04-3.66-6.3l1.36-1.36C20.04 6.4 22 9.04 22 12c0 2.37-.93 4.53-2.54 6.13zM2.1 3.51L0.69 4.92l5 5V15h4l5 5v-4.09l5.07 5.07 1.41-1.41L2.1 3.51z" />
  </svg>
);

export default VolumeOffIcon;
