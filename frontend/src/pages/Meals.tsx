import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MealList } from "@/components/MealList";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Meals = () => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Mes repas
              </h1>
            </div>
            <Button asChild variant="outline">
              <Link to="/">Retour</Link>
            </Button>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6">
          <MealList />
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
);

export default Meals;
