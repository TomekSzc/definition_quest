import { Header } from "../ui/Header";
import Sidebar from "../ui/Sidebar/Sidebar";
import { protectedRoutes } from "@/lib/@routes";

export const ReactLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isProtected = Object.values(protectedRoutes).includes(pathname as protectedRoutes);

  if (!isProtected) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <div>{children}</div>
      </div>
    </>
  );
};
