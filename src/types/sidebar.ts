export interface NavItemVM {
  label: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
}
