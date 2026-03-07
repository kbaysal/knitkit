import { Suspense } from "react";
import { UserButton } from "@clerk/nextjs";
import { AppSidebar, BottomNav } from "@/components/app-sidebar";
import { RavelryDataProvider } from "@/hooks/use-ravelry-data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <RavelryDataProvider>
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Mobile header */}
            <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
              <span className="font-semibold text-lg">KnitKit</span>
              <UserButton />
            </header>
            <main className="flex flex-1 flex-col overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
              {children}
            </main>
            <BottomNav />
          </div>
        </div>
      </RavelryDataProvider>
    </Suspense>
  );
}
