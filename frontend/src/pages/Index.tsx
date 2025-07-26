import { format } from "date-fns";
import { useState } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { DashboardCard } from "@/components/DashboardCard";
import { MacroProgress } from "@/components/MacroProgress";
import { QuickActions } from "@/components/QuickActions";
import { AdviceBanner } from "@/components/AdviceBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Droplet, Target, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDailySummary } from "@/hooks/use-daily-summary";
import heroImage from "@/assets/nutriflow-hero.jpg";

const Index = () => {
  const { toast } = useToast();
  
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: summary, isLoading } = useDailySummary(today);

  const showHydration = false;

  const macrosData = {
    protein: { current: 0, target: 100 },
    carbs: { current: 0, target: 100 },
    fat: { current: 0, target: 100 },
  };

  const calorieBalance = (summary?.calories_apportees || 0) - (summary?.calories_brulees || 0);
  const remainingCalories = (summary?.tdee || 0) - calorieBalance;


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Dashboard NutriFlow
                </h1>
              </div>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-6">
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
                  ? `Il vous reste ${remainingCalories} calories à consommer pour atteindre votre objectif.`
                  : `Vous avez dépassé votre objectif de ${Math.abs(remainingCalories)} calories.`}
                type={remainingCalories > 0 ? "info" : "warning"}
              />
            )}

            {/* Quick Actions */}
            <QuickActions />

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Calories consommées"
                value={summary ? Math.round(summary.calories_apportees) : 0}
                subtitle={summary ? `/ ${Math.round(summary.tdee)} kcal` : undefined}
                icon={<Flame className="h-4 w-4" />}
                variant="calories"
                loading={isLoading}
              />
              
              <DashboardCard
                title="Calories brûlées"
                value={summary ? Math.round(summary.calories_brulees) : 0}
                subtitle="kcal d'activité"
                icon={<TrendingUp className="h-4 w-4" />}
                variant="protein"
                loading={isLoading}
              />
              
              <DashboardCard
                title="Balance calorique"
                value={calorieBalance > 0 ? `+${Math.round(calorieBalance)}` : Math.round(calorieBalance)}
                subtitle="kcal net"
                icon={<Target className="h-4 w-4" />}
                variant={calorieBalance > 0 ? "carbs" : "fat"}
                trend={calorieBalance > 0 ? "up" : "down"}
                loading={isLoading}
              />
              
              {showHydration && (
                <DashboardCard
                  title="Hydratation"
                  value="0/0"
                  subtitle="verres d'eau"
                  icon={<Droplet className="h-4 w-4" />}
                  variant="default"
                  loading={isLoading}
                />
              )}
            </div>

            {/* Macros and Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Résumé du jour</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">TDEE</span>
                      <span className="text-sm font-medium">{summary ? Math.round(summary.tdee) : 0} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Objectif restant</span>
                      <span className={`text-sm font-medium ${remainingCalories > 0 ? 'text-success' : 'text-warning'}`}>
                        {remainingCalories > 0 ? remainingCalories : 0} kcal
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Efficacité</span>
                      <span className="text-sm font-medium text-success">87%</span>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-wellness hover:shadow-medium transition-all duration-300"
                    onClick={() => toast({ title: "Rapport détaillé disponible bientôt" })}
                  >
                    Voir le rapport détaillé
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;