import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { BottomNav } from "@/components/BottomNav";
import { DailyInsightCard } from "@/components/DailyInsightCard";
import { TemporalNavigator } from "@/components/TemporalNavigator";
import {
  fetchMeals,
  fetchActivities,
  type Meal,
  type Activity,
} from "@/services/api";
import { useDailySummary } from "@/hooks/use-daily-summary";
import { useQuery } from "@tanstack/react-query";

const Historique = () => {
  const [date, setDate] = useState<Date>(new Date());
  const dateStr = format(date, "yyyy-MM-dd");

  const { data: summary } = useDailySummary(dateStr);
  const { data: meals } = useQuery<Meal[]>({
    queryKey: ["meals", dateStr],
    queryFn: () => fetchMeals(dateStr),
  });
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["activities", dateStr],
    queryFn: () => fetchActivities(dateStr),
  });

  const [openMeal, setOpenMeal] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center gap-4 px-6">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Historique quotidien
            </h1>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6 pb-24 md:pb-6">
          <div className="flex items-center justify-center md:justify-start">
            <TemporalNavigator
              selectedDate={date}
              onDateChange={setDate}
            />
          </div>

          {summary && (
            summary.calories_consumed > 0 || meals?.length > 0 || activities?.length > 0 ? (
              <DailyInsightCard
                dailySummary={summary}
                date={dateStr}
                className="shadow-soft"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune donnée nutritionnelle disponible pour cette date.</p>
                <p className="text-sm mt-2">Ajoutez des repas ou des activités pour voir le bilan quotidien.</p>
              </div>
            )
          )}

          <Tabs defaultValue="meals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meals">Repas</TabsTrigger>
              <TabsTrigger value="activities">Activités</TabsTrigger>
            </TabsList>
            <TabsContent value="meals" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Repas de la journée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {meals?.map((meal) => {
                    const total = meal.ingredients.reduce(
                      (acc, it) => acc + (it.calories ?? 0),
                      0
                    );
                    const isOpen = openMeal === meal.id;
                    return (
                      <div key={meal.id} className="border-b pb-2 last:border-b-0">
                        <div className="flex justify-between items-center">
                          <div>{meal.type}</div>
                          <div>{Math.round(total)} kcal</div>
                        </div>
                        {isOpen && (
                          <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                            {meal.ingredients.map((ing) => (
                              <li key={ing.id}>
                                {ing.nom_aliment} - {ing.calories ?? 0} kcal
                              </li>
                            ))}
                          </ul>
                        )}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-sm"
                          onClick={() => setOpenMeal(isOpen ? null : meal.id)}
                        >
                          {isOpen ? "Voir moins" : "Voir plus"}
                        </Button>
                      </div>
                    );
                  })}
                  {!meals?.length && <p>Aucun repas enregistré.</p>}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="activities" className="space-y-4">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Activités sportives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activities?.map((act) => (
                    <div key={act.id} className="flex justify-between">
                      <div>
                        <div>{act.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {act.duree_min} min
                        </div>
                      </div>
                      <div>{Math.round(act.calories_brulees)} kcal</div>
                    </div>
                  ))}
                  {!activities?.length && <p>Aucune activité enregistrée.</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button variant="secondary">Voir rapport complet</Button>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
};

export default Historique;
