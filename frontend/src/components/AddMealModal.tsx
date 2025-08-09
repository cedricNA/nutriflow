import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeIngredients, fetchUnits, type Totals } from "@/services/api";

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface AddMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Type de repas pré-sélectionné lors de l'ouverture */
  defaultType?: string;
  /** Date du repas au format YYYY-MM-DD */
  date?: string;
  /** Callback appelé après l'ajout réussi d'un repas */
  onAdded?: () => void;
}

export const AddMealModal = ({
  open,
  onOpenChange,
  defaultType,
  date,
  onAdded,
}: AddMealModalProps) => {
  const { toast } = useToast();
  const [mealType, setMealType] = useState<string>(defaultType || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "g"
  });

  const [units, setUnits] = useState<string[]>([]);
  const mealTypes = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];

  // Met à jour le type présélectionné si la valeur change
  useEffect(() => {
    setMealType(defaultType || "");
  }, [defaultType]);

  // Réinitialise le formulaire à la fermeture
  useEffect(() => {
    if (!open) {
      setIngredients([]);
      setNewIngredient({ name: "", quantity: "", unit: "g" });
      setTotals(null);
    }
  }, [open]);

  useEffect(() => {
    fetchUnits()
      .then((data) => setUnits(Object.keys(data)))
      .catch((err) => console.error("Erreur chargement unités", err));
  }, []);

  const addIngredient = () => {
    if (!newIngredient.name || !newIngredient.quantity) return;

    const ingredient: Ingredient = {
      id: Date.now().toString(),
      name: newIngredient.name,
      quantity: Number(newIngredient.quantity),
      unit: newIngredient.unit
    };

    setIngredients([...ingredients, ingredient]);
    setNewIngredient({ name: "", quantity: "", unit: "g" });
    setTotals(null);
  };

  const removeIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
    setTotals(null);
  };

  const handleSaveMeal = async () => {
    if (!mealType || ingredients.length === 0) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner un type de repas et ajouter au moins un ingrédient.",
        variant: "destructive"
      });
      return;
    }
    const query = ingredients
      .map((ing) => `${ing.quantity} ${ing.unit} ${ing.name}`)
      .join(", ");

    try {
      const result = await analyzeIngredients(query, mealType, date);
      setTotals(result.totals);
      console.log("Résumé nutritionnel :", result.totals);
      toast({
        title: "Repas ajouté avec succès",
        description: `${ingredients.length} ingrédient(s) enregistrés`,
      });
      onAdded?.();
      setIngredients([]);
      setNewIngredient({ name: "", quantity: "", unit: "g" });
      onOpenChange(false);
    } catch (err) {
      console.error("Erreur lors de l'analyse :", err);
      toast({
        title: "Erreur lors de l'analyse",
        description: String(err),
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Ajouter un repas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type de repas */}
          <div className="space-y-2">
            <Label htmlFor="meal-type">Type de repas</Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type de repas" />
              </SelectTrigger>
              <SelectContent>
                {mealTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ajouter un ingrédient */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Ajouter un ingrédient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Label htmlFor="ingredient-name">Nom de l'ingrédient</Label>
                  <Input
                    id="ingredient-name"
                    value={newIngredient.name}
                    onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                    placeholder="Ex: Pomme, Riz, Poulet..."
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newIngredient.quantity}
                    onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unité</Label>
                  <Select 
                    value={newIngredient.unit} 
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={addIngredient}
                className="w-full bg-gradient-wellness hover:shadow-medium transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter l'ingrédient
              </Button>
            </CardContent>
          </Card>

          {/* Liste des ingrédients */}
          {ingredients.length > 0 && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Ingrédients du repas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ingredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{ingredient.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {ingredient.quantity} {ingredient.unit}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Résumé nutritionnel */}
          {totals && (
            <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Résumé nutritionnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-calories">{Math.round(totals.total_calories)}</div>
                    <div className="text-sm text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-protein">{Math.round(totals.total_proteins_g)}g</div>
                    <div className="text-sm text-muted-foreground">Protéines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-carbs">{Math.round(totals.total_carbs_g)}g</div>
                    <div className="text-sm text-muted-foreground">Glucides</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-fat">{Math.round(totals.total_fats_g)}g</div>
                    <div className="text-sm text-muted-foreground">Lipides</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-gradient-primary hover:shadow-medium transition-all duration-300"
              onClick={handleSaveMeal}
            >
              Valider le repas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};