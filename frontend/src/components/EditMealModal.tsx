import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchUnits, updateMeal, type Meal, type MealItem } from "@/services/api";

interface EditMealModalProps {
  meal: Meal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

type EditableItem = MealItem & { tempId?: string };

interface UpdateMealPayload {
  type: string;
  add: { nom_aliment: string; quantite: number; unite: string }[];
  update: { id: string; nom_aliment: string; quantite: number; unite: string }[];
  delete?: string[];
}

export const EditMealModal = ({ meal, open, onOpenChange, onUpdated }: EditMealModalProps) => {
  const { toast } = useToast();
  const [mealType, setMealType] = useState<string>("");
  const [items, setItems] = useState<EditableItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [newItem, setNewItem] = useState({ nom_aliment: "", quantite: "", unite: "g" });
  const mealTypes = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];

  useEffect(() => {
    fetchUnits().then((u) => setUnits(Object.keys(u))).catch(console.error);
  }, []);

  useEffect(() => {
    if (meal) {
      setMealType(meal.type);
      setItems(meal.ingredients.map((i) => ({ ...i })));
      setDeletedIds([]);
    }
  }, [meal]);

  const addItem = () => {
    if (!newItem.nom_aliment || !newItem.quantite) return;
    setItems([ ...items, { tempId: Date.now().toString(), nom_aliment: newItem.nom_aliment, quantite: Number(newItem.quantite), unite: newItem.unite } ]);
    setNewItem({ nom_aliment: "", quantite: "", unite: "g" });
  };

  const removeItem = (id?: string, tempId?: string) => {
    if (id) setDeletedIds([...deletedIds, id]);
    setItems(items.filter((it) => it.id !== id && it.tempId !== tempId));
  };

  const handleSave = async () => {
    if (!meal) return;
    const payload: UpdateMealPayload = {
      type: mealType,
      add: items.filter((i) => !i.id).map(({ nom_aliment, quantite, unite }) => ({ nom_aliment, quantite, unite })),
      update: items.filter((i) => i.id).map(({ id, nom_aliment, quantite, unite }) => ({ id: id!, nom_aliment, quantite, unite })),
      delete: deletedIds.length ? deletedIds : undefined,
    };
    try {
      const updated = await updateMeal(meal.id, payload);
      setMealType(updated.type);
      setItems(updated.ingredients.map((it) => ({ ...it })));
      setDeletedIds([]);
      toast({ title: "Repas mis à jour" });
      onUpdated();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Éditer le repas</DialogTitle>
        </DialogHeader>
        {meal && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="meal-type">Type de repas</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {mealTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Ajouter un ingrédient</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Nom</Label>
                  <Input value={newItem.nom_aliment} onChange={(e) => setNewItem({ ...newItem, nom_aliment: e.target.value })} />
                </div>
                <div>
                  <Label>Quantité</Label>
                  <Input type="number" value={newItem.quantite} onChange={(e) => setNewItem({ ...newItem, quantite: e.target.value })} />
                </div>
                <div>
                  <Label>Unité</Label>
                  <Select value={newItem.unite} onValueChange={(v) => setNewItem({ ...newItem, unite: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addItem} className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              </CardContent>
            </Card>

            {items.map((item) => (
              <div key={item.id ?? item.tempId} className="flex items-center gap-3">
                <Input
                  value={item.nom_aliment}
                  onChange={(e) => setItems(items.map((it) => it === item ? { ...it, nom_aliment: e.target.value } : it))}
                />
                <Input
                  type="number"
                  value={item.quantite}
                  onChange={(e) => setItems(items.map((it) => it === item ? { ...it, quantite: Number(e.target.value) } : it))}
                />
                <Select
                  value={item.unite}
                  onValueChange={(v) => setItems(items.map((it) => it === item ? { ...it, unite: v } : it))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id, item.tempId)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Separator />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button className="flex-1 bg-gradient-primary" onClick={handleSave}>
                Sauvegarder
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
