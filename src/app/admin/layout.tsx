import { AdminSidebar } from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[var(--bg-color)]">
      <AdminSidebar />
      <main className="flex-grow flex flex-col relative min-h-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
