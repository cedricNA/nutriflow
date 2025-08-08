import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  fetchActivities,
  deleteActivity,
  fetchDailySummary,
  type Activity,
} from "@/services/api";
import { AddActivityModal } from "./AddActivityModal";

export const ActivityList = () => {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalBurned, setTotalBurned] = useState(0);
  const queryClient = useQueryClient();

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await fetchActivities(selectedDate);
      setActivities(data);
      setTotalBurned(data.reduce((acc, a) => acc + a.calories_brulees, 0));
      const sum = await fetchDailySummary(selectedDate);
      queryClient.setQueryData(["daily-summary", selectedDate], sum);
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur chargement activités",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [selectedDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette activité ?")) return;
    try {
      setLoading(true);
      await deleteActivity(id);
      toast({ title: "Activité supprimée" });
      await loadActivities();
      queryClient.invalidateQueries({
        queryKey: ["daily-summary", selectedDate],
      });
    } catch (err) {
      console.error(err);
      toast({ title: "Erreur", description: String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {editing && (
        <AddActivityModal
          open={Boolean(editing)}
          onOpenChange={(o) => !o && setEditing(null)}
          activity={editing}
          onSaved={() => {
            loadActivities();
            queryClient.invalidateQueries({
              queryKey: ["daily-summary", selectedDate],
            });
          }}
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
      {loading && <p>Chargement...</p>}
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
      {activities.length === 0 && !loading && (
        <p>Aucune activité pour cette date.</p>
      )}
      {activities.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Total : {Math.round(totalBurned)} kcal brûlées
        </div>
      )}
      <Separator />
    </div>
  );
};
