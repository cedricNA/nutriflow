import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dumbbell, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeExercise } from "@/services/api";

interface AddActivityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddActivityModal = ({ open, onOpenChange }: AddActivityModalProps) => {
  const { toast } = useToast();
  const [activityType, setActivityType] = useState<string>("");
  const [customActivity, setCustomActivity] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [intensity, setIntensity] = useState<string>("moderate");

  const predefinedActivities = [
    { name: "Course à pied", met: 8.0 },
    { name: "Vélo", met: 6.0 },
    { name: "Natation", met: 7.0 },
    { name: "Marche rapide", met: 4.0 },
    { name: "Musculation", met: 5.0 },
    { name: "Yoga", met: 3.0 },
    { name: "Football", met: 7.0 },
    { name: "Tennis", met: 6.0 },
    { name: "Autre (personnalisé)", met: 5.0 }
  ];

  const intensityLevels = [
    { value: "light", label: "Léger", multiplier: 0.8 },
    { value: "moderate", label: "Modéré", multiplier: 1.0 },
    { value: "intense", label: "Intense", multiplier: 1.3 }
  ];

  const [estimatedCalories, setEstimatedCalories] = useState<number | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      const finalActivity =
        activityType === "Autre (personnalisé)" ? customActivity : activityType;
      if (!finalActivity || !duration) {
        setEstimatedCalories(null);
        return;
      }
      try {
        setLoadingPreview(true);
        const data = await analyzeExercise(
          `${duration} minutes de ${finalActivity}`,
          true
        );
        const base = data[0]?.calories ?? 0;
        const intensityMultiplier =
          intensityLevels.find((i) => i.value === intensity)?.multiplier || 1.0;
        setEstimatedCalories(Math.round(base * intensityMultiplier));
      } catch (err) {
        console.error("Erreur preview exercice", err);
        setEstimatedCalories(null);
      } finally {
        setLoadingPreview(false);
      }
    };
    fetchPreview();
  }, [activityType, customActivity, duration, intensity]);

  const handleSaveActivity = async () => {
    const finalActivity =
      activityType === "Autre (personnalisé)" ? customActivity : activityType;

    if (!finalActivity || !duration) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez sélectionner une activité et indiquer la durée.",
        variant: "destructive"
      });
      return;
    }

    try {
      const data = await analyzeExercise(`${duration} minutes de ${finalActivity}`);
      const base = data[0]?.calories ?? 0;
      const intensityMultiplier =
        intensityLevels.find((i) => i.value === intensity)?.multiplier || 1.0;
      const caloriesBurned = Math.round(base * intensityMultiplier);

      toast({
        title: "Activité ajoutée avec succès",
        description: `${finalActivity} - ${duration} min - ${caloriesBurned} kcal brûlées`,
      });

      setActivityType("");
      setCustomActivity("");
      setDuration("");
      setIntensity("moderate");
      onOpenChange(false);
    } catch (err) {
      console.error("Erreur enregistrement activité", err);
      toast({
        title: "Erreur lors de l'enregistrement",
        description: String(err),
        variant: "destructive",
      });
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Ajouter une activité sportive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Type d'activité */}
          <div className="space-y-2">
            <Label htmlFor="activity-type">Type d'activité</Label>
            <Input
              list="activities"
              id="activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              placeholder="Choisir ou taper..."
            />
            <datalist id="activities">
              {predefinedActivities.map((activity) => (
                <option key={activity.name} value={activity.name} />
              ))}
            </datalist>
          </div>

          {/* Activité personnalisée */}
          {activityType === "Autre (personnalisé)" && (
            <div className="space-y-2">
              <Label htmlFor="custom-activity">Nom de l'activité</Label>
              <Input
                id="custom-activity"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                placeholder="Ex: Jardinage, Danse, Boxe..."
              />
            </div>
          )}

          {/* Durée */}
          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              min="1"
            />
          </div>

          {/* Intensité */}
          <div className="space-y-2">
            <Label htmlFor="intensity">Intensité</Label>
            <Select value={intensity} onValueChange={setIntensity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intensityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimation des calories */}
          {estimatedCalories !== null && (
            <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Estimation des calories brûlées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">
                    {loadingPreview ? '...' : estimatedCalories}
                  </div>
                  <div className="text-sm text-muted-foreground">calories brûlées</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Basé sur une personne de 70kg, intensité {intensityLevels.find(i => i.value === intensity)?.label.toLowerCase()}
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
              className="flex-1 bg-gradient-wellness hover:shadow-medium transition-all duration-300"
              onClick={handleSaveActivity}
            >
              <Dumbbell className="h-4 w-4 mr-2" />
              Ajouter l'activité
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};