import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Toaster position="top-right" />
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        <Sidebar />
        {children}
      </main>
    </>
  );
}
