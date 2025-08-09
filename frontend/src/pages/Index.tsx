import { format } from "date-fns";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardCard } from "@/components/DashboardCard";
import { MacroProgress } from "@/components/MacroProgress";
import { QuickActions } from "@/components/QuickActions";
import { AdviceBanner } from "@/components/AdviceBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Drumstick, Wheat, Egg } from "lucide-react";
import { useDailySummary } from "@/hooks/use-daily-summary";
import heroImage from "@/assets/nutriflow-hero.jpg";

const Index = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: summary, isLoading } = useDailySummary(today);

  const macrosData = {
    protein: { current: summary?.proteins_consumed ?? 0, target: summary?.proteins_goal },
    carbs: { current: summary?.carbs_consumed ?? 0, target: summary?.carbs_goal },
    fat: { current: summary?.fats_consumed ?? 0, target: summary?.fats_goal },
  };

  const remainingCalories =
    (summary?.calories_goal ?? 0) - (summary?.calories_consumed ?? 0);


  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Dashboard NutriFlow
            </h1>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6 pb-24 md:pb-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-xl shadow-strong">
              <img 
                src={heroImage} 
                alt="NutriFlow Dashboard" 
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center">
                <div className="p-6 text-primary-foreground">
                  <h2 className="text-3xl font-bold mb-2">Bienvenue dans NutriFlow</h2>
                  <p className="text-lg opacity-90">Suivez votre alimentation et vos activités en toute simplicité</p>
                </div>
              </div>
            </div>

            {/* Advice Banner */}
            {summary && (
              <AdviceBanner
                message={remainingCalories > 0
                  ? `Il vous reste ${Math.round(remainingCalories)} calories à consommer pour atteindre votre objectif.`
                  : `Vous avez dépassé votre objectif de ${Math.abs(Math.round(remainingCalories))} calories.`}
                type={remainingCalories > 0 ? "info" : "warning"}
              />
            )}

            {/* Quick Actions */}
            <QuickActions />

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Calories"
                value={summary?.calories_consumed ?? 0}
                goal={summary?.calories_goal}
                unit="kcal"
                icon={<Flame className="h-4 w-4" />}
                variant="calories"
                loading={isLoading}
              />
              <DashboardCard
                title="Protéines"
                value={summary?.proteins_consumed ?? 0}
                goal={summary?.proteins_goal}
                unit="g"
                icon={<Drumstick className="h-4 w-4" />}
                variant="protein"
                loading={isLoading}
              />
              <DashboardCard
                title="Glucides"
                value={summary?.carbs_consumed ?? 0}
                goal={summary?.carbs_goal}
                unit="g"
                icon={<Wheat className="h-4 w-4" />}
                variant="carbs"
                loading={isLoading}
              />
              <DashboardCard
                title="Lipides"
                value={summary?.fats_consumed ?? 0}
                goal={summary?.fats_goal}
                unit="g"
                icon={<Egg className="h-4 w-4" />}
                variant="fat"
                loading={isLoading}
              />
            </div>

            {/* Macros and Progress */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Progression des macronutriments</CardTitle>
              </CardHeader>
              <CardContent>
                <MacroProgress
                  protein={macrosData.protein}
                  carbs={macrosData.carbs}
                  fat={macrosData.fat}
                />
              </CardContent>
            </Card>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;