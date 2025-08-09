import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  fetchMeals,
  deleteMeal,
  deleteMealItem,
  fetchDailySummary,
  type Meal,
} from "@/services/api";
import { useSearchParams } from "react-router-dom";
import { EditMealModal } from "./EditMealModal";
import { AddMealModal } from "./AddMealModal";

export const MealList = () => {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDate = searchParams.get("date_str") || today;
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addMealType, setAddMealType] = useState<string | undefined>(undefined);
  const mealTypes = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];
  const queryClient = useQueryClient();

  const loadMeals = async () => {
    try {
      const data = await fetchMeals(selectedDate);
      setMeals(data);
      queryClient.setQueryData(["daily-summary", selectedDate], await fetchDailySummary(selectedDate));
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur chargement repas",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMeals();
  }, [selectedDate]);

  useEffect(() => {
    const param = searchParams.get("date_str");
    if (param && param !== selectedDate) {
      setSelectedDate(param);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("date_str") !== selectedDate) {
      setSearchParams({ date_str: selectedDate });
    }
  }, [selectedDate, searchParams, setSearchParams]);

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm("Supprimer ce repas ?")) return;
    try {
      await deleteMeal(mealId);
      toast({ title: "Repas supprimé" });
      loadMeals();
      queryClient.invalidateQueries({
        queryKey: ["daily-summary", selectedDate],
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Supprimer cet ingrédient ?")) return;
    try {
      await deleteMealItem(itemId);
      toast({ title: "Ingrédient supprimé" });
      loadMeals();
      queryClient.invalidateQueries({
        queryKey: ["daily-summary", selectedDate],
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    }
  };

  const missingTypes = mealTypes.filter(
    (t) => !meals.some((m) => m.type === t)
  );

  return (
    <div className="space-y-4">
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          open={Boolean(editingMeal)}
          onOpenChange={(o) => !o && setEditingMeal(null)}
          onUpdated={() => {
            loadMeals();
            queryClient.invalidateQueries({
              queryKey: ["daily-summary", selectedDate],
            });
          }}
        />
      )}
      <AddMealModal
        open={addMealOpen}
        onOpenChange={(o) => {
          setAddMealOpen(o);
          if (!o) setAddMealType(undefined);
        }}
        defaultType={addMealType}
        date={selectedDate}
        onAdded={() => {
          loadMeals();
          queryClient.invalidateQueries({
            queryKey: ["daily-summary", selectedDate],
          });
        }}
      />
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
        <Button onClick={loadMeals}>Afficher</Button>
      </div>
      {meals.map((meal) => {
        const summary = meal.ingredients.reduce(
          (acc, it) => {
            acc.cal += it.calories || 0;
            acc.prot += it.proteines_g || 0;
            acc.carb += it.glucides_g || 0;
            acc.fat += it.lipides_g || 0;
            return acc;
          },
          { cal: 0, prot: 0, carb: 0, fat: 0 }
        );
        return (
          <Card key={meal.id} className="shadow-soft">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{meal.type}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditingMeal(meal)}>
                  Éditer
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteMeal(meal.id)}
                >
                  Supprimer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {meal.ingredients.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    {item.nom_aliment} - {item.quantite} {item.unite}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id!)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <div className="text-sm text-muted-foreground pt-2">
                {Math.round(summary.cal)} kcal – {Math.round(summary.prot)}g P /{' '}
                {Math.round(summary.carb)}g G / {Math.round(summary.fat)}g L
              </div>
            </CardContent>
          </Card>
        );
      })}
      {meals.length === 0 && <p>Aucun repas pour cette date.</p>}
      {missingTypes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missingTypes.map((t) => (
            <Button
              key={t}
              onClick={() => {
                setAddMealType(t);
                setAddMealOpen(true);
              }}
            >
              Ajouter {t}
            </Button>
          ))}
        </div>
      )}
      {meals.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {(() => {
            const tot = meals.reduce(
              (acc, m) => {
                m.ingredients.forEach((it) => {
                  acc.cal += it.calories || 0;
                  acc.prot += it.proteines_g || 0;
                  acc.carb += it.glucides_g || 0;
                  acc.fat += it.lipides_g || 0;
                });
                return acc;
              },
              { cal: 0, prot: 0, carb: 0, fat: 0 }
            );
            return `${Math.round(tot.cal)} kcal – ${Math.round(tot.prot)}g P / ${Math.round(tot.carb)}g G / ${Math.round(tot.fat)}g L`;
          })()}
        </div>
      )}
      <Separator />
    </div>
  );
};
