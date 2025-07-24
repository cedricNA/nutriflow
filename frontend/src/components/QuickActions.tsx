import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, UtensilsCrossed, Dumbbell, Scan, List } from "lucide-react";
import { Link } from "react-router-dom";
import { AddMealModal } from "./AddMealModal";
import { AddActivityModal } from "./AddActivityModal";
import { ScanProductModal } from "./ScanProductModal";

interface QuickActionsProps {}

export const QuickActions = ({}: QuickActionsProps) => {
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [scanProductOpen, setScanProductOpen] = useState(false);

  return (
    <>
      <AddMealModal open={addMealOpen} onOpenChange={setAddMealOpen} />
      <AddActivityModal open={addActivityOpen} onOpenChange={setAddActivityOpen} />
      <ScanProductModal open={scanProductOpen} onOpenChange={setScanProductOpen} />
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Button 
          onClick={() => setAddMealOpen(true)}
          variant="default"
          className="flex items-center gap-2 h-12 bg-gradient-primary hover:shadow-medium transition-all duration-300"
        >
          <UtensilsCrossed className="h-4 w-4" />
          Ajouter un repas
        </Button>
        
        <Button 
          onClick={() => setAddActivityOpen(true)}
          variant="secondary"
          className="flex items-center gap-2 h-12 hover:shadow-medium transition-all duration-300"
        >
          <Dumbbell className="h-4 w-4" />
          Activité sportive
        </Button>
        
        <Button
          onClick={() => setScanProductOpen(true)}
          variant="outline"
          className="flex items-center gap-2 h-12 hover:shadow-medium transition-all duration-300 border-accent text-accent hover:bg-accent hover:text-accent-foreground"
        >
          <Scan className="h-4 w-4" />
          Scanner produit
        </Button>

        <Button asChild variant="outline" className="flex items-center gap-2 h-12 hover:shadow-medium transition-all duration-300">
          <Link to="/meals">
            <List className="h-4 w-4" />
            Mes repas
          </Link>
        </Button>
      </CardContent>
    </Card>
    </>
  );
};