import { useEffect, useState } from "react";
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
  type Meal,
} from "@/services/api";
import { EditMealModal } from "./EditMealModal";

export const MealList = () => {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);

  const loadMeals = async () => {
    try {
      const data = await fetchMeals(selectedDate);
      setMeals(data);
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

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm("Supprimer ce repas ?")) return;
    try {
      await deleteMeal(mealId);
      toast({ title: "Repas supprimé" });
      loadMeals();
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
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          open={Boolean(editingMeal)}
          onOpenChange={(o) => !o && setEditingMeal(null)}
          onUpdated={loadMeals}
        />
      )}
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
        <Button onClick={loadMeals}>Afficher</Button>
      </div>
      {meals.map((meal) => (
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
              <div key={item.id} className="flex justify-between items-center">
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
          </CardContent>
        </Card>
      ))}
      {meals.length === 0 && <p>Aucun repas pour cette date.</p>}
      <Separator />
    </div>
  );
};
