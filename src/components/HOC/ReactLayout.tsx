import { Header } from "../ui/Header";
import Sidebar from "../ui/Sidebar/Sidebar";
import { ProtectedRoutes } from "@/lib/routes";
import { Footer } from "../ui/Footer";

export const ReactLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  console.log(pathname);
  const isProtected = Object.values(ProtectedRoutes).includes(pathname as ProtectedRoutes) 
  || pathname.startsWith(ProtectedRoutes.BOARDS);

  if (!isProtected) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex flex-col overflow-x-hidden pt-[60px] md:pt-[80px] bg-secondary">
        <Header />
        <div>{children}</div>
        <Footer />
      </div>
    </>
  );
};
