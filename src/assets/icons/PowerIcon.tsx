import type { FC, SVGProps } from "react";

const PowerIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2v10" />
    <path d="M5.64 5.64a9 9 0 1 0 12.72 0" />
  </svg>
);

export default PowerIcon;
