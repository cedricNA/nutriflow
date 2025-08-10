import { format } from "date-fns";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { DashboardCard } from "@/components/DashboardCard";
import { QuickActions } from "@/components/QuickActions";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Flame, Drumstick, Wheat, Egg, Info as InfoIcon } from "lucide-react";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { useGoals } from "@/hooks/use-goals";
import heroImage from "@/assets/nutriflow-hero.jpg";

const Index = () => {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: summary, isLoading } = useDailySummary(today);
  const { data: goals, isLoading: goalsLoading, error: goalsError } = useGoals();

  const caloriesConsumed = summary?.calories_consumed ?? 0;
  const proteinConsumed = summary?.prot_tot ?? summary?.proteins_consumed ?? 0;
  const carbsConsumed = summary?.gluc_tot ?? summary?.carbs_consumed ?? 0;
  const fatConsumed = summary?.lip_tot ?? summary?.fats_consumed ?? 0;

  const remainingCalories =
    (goals?.target_kcal ?? 0) - caloriesConsumed;


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

            {/* Message sur les calories restantes */}
            {summary && (
              <div className="flex items-center bg-gray-100 border border-gray-200 p-2 rounded-md text-gray-800 font-medium">
                <p>
                  {remainingCalories > 0
                    ? `Il vous reste ${Math.round(remainingCalories)} calories à consommer pour atteindre votre objectif.`
                    : `Vous avez dépassé votre objectif de ${Math.abs(Math.round(remainingCalories))} calories.`}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="w-4 h-4 ml-2 cursor-pointer text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm leading-snug">
                    <p><strong>Pourquoi ce chiffre ?</strong></p>
                    <p>Il s’agit du nombre de calories qu’il vous reste à consommer aujourd’hui pour atteindre votre objectif (perte de poids, maintien ou prise de masse).</p>
                    <ul className="mt-1 list-disc list-inside">
                      <li>Votre objectif nutritionnel</li>
                      <li>Votre TDEE (dépense journalière)</li>
                      <li>Les aliments consommés</li>
                      <li>Les calories brûlées</li>
                    </ul>
                    <p className="mt-1">
                      ✅ Si le chiffre est négatif, vous avez dépassé votre objectif.<br />
                      ✅ S’il reste des calories, vous pouvez encore manger.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Quick Actions */}
            <QuickActions />

            {/* Objectif du jour */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Objectif du jour</h2>

              {goalsError && (
                <Alert variant="destructive">
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>
                    Impossible de charger les objectifs.
                  </AlertDescription>
                </Alert>
              )}

              <DashboardCard
                title="Calories"
                value={caloriesConsumed}
                goal={goals?.target_kcal}
                unit="kcal"
                icon={<Flame className="h-4 w-4" />}
                variant="calories"
                loading={isLoading || goalsLoading}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DashboardCard
                  title="Protéines"
                  value={proteinConsumed}
                  goal={goals?.prot_g}
                  unit="g"
                  icon={<Drumstick className="h-4 w-4" />}
                  variant="protein"
                  loading={isLoading || goalsLoading}
                  info="Protéines ≈ 1.8–2.0 g/kg selon l’objectif"
                />
                <DashboardCard
                  title="Glucides"
                  value={carbsConsumed}
                  goal={goals?.carbs_g}
                  unit="g"
                  icon={<Wheat className="h-4 w-4" />}
                  variant="carbs"
                  loading={isLoading || goalsLoading}
                  info="Glucides = énergie restante après prot/lipides"
                  badge={goals && goals.carbs_g === 0 ? "cible lipides/protéines trop haute pour ce TDEE" : undefined}
                />
                <DashboardCard
                  title="Lipides"
                  value={fatConsumed}
                  goal={goals?.fat_g}
                  unit="g"
                  icon={<Egg className="h-4 w-4" />}
                  variant="fat"
                  loading={isLoading || goalsLoading}
                  info="Lipides ≈ 0.8 g/kg"
                />
              </div>
            </section>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;
