import type { FC } from "react";

const BoardsIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 3h6v6H4V3zm0 12h6v6H4v-6zm10-12h6v6h-6V3zm0 12h6v6h-6v-6z" />
  </svg>
);

export default BoardsIcon;
