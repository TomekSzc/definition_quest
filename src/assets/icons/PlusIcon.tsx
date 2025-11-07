import type { FC } from "react";

const PlusIcon: FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6v-2z" />
  </svg>
);

export default PlusIcon;
