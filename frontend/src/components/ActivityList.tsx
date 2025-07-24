import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  fetchActivities,
  deleteActivity,
  type Activity,
} from "@/services/api";
import { AddActivityModal } from "./AddActivityModal";

export const ActivityList = () => {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editing, setEditing] = useState<Activity | null>(null);

  const loadActivities = async () => {
    try {
      const data = await fetchActivities(selectedDate);
      setActivities(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur chargement activités",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadActivities();
  }, [selectedDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette activité ?")) return;
    try {
      await deleteActivity(id);
      toast({ title: "Activité supprimée" });
      loadActivities();
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {editing && (
        <AddActivityModal
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          activity={editing}
          onSaved={loadActivities}
        />
      )}
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
        <Button onClick={loadActivities}>Afficher</Button>
      </div>
      {activities.map((act) => (
        <Card key={act.id} className="shadow-soft">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>{act.description}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setEditing(act)}>
                Éditer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(act.id)}
              >
                Supprimer
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div>Durée : {act.duree_min} min</div>
            <div>Calories brûlées : {act.calories_brulees}</div>
            {act.intensite && <div>Intensité : {act.intensite}</div>}
          </CardContent>
        </Card>
      ))}
      {activities.length === 0 && <p>Aucune activité pour cette date.</p>}
      <Separator />
    </div>
  );
};
