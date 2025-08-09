import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { ActivityList } from "@/components/ActivityList";

const Activities = () => (
  <div className="min-h-screen flex w-full bg-background">
    <AppSidebar />
    <div className="flex-1 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">Mes activités</h1>
        </div>
      </header>
      <main className="flex-1 space-y-6 p-6 pb-24 md:pb-6">
        <ActivityList />
      </main>
    </div>
    <BottomNav />
  </div>
);

export default Activities;
