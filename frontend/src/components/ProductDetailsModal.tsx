import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchProductDetails, type ProductDetails } from "@/services/api";

interface ProductDetailsModalProps {
  barcode: string | null;
  onClose: () => void;
}
export const ProductDetailsModal = ({ barcode, onClose }: ProductDetailsModalProps) => {
  const [details, setDetails] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!barcode) return;
    setLoading(true);
    fetchProductDetails(barcode)
      .then((data) => {
        setDetails(data);
        setError(null);
      })
      .catch(() => setError("Erreur lors du chargement."))
      .finally(() => setLoading(false));
  }, [barcode]);

  if (!barcode) return null;

  return (
    <Dialog open={!!barcode} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Détails produit</DialogTitle>
        </DialogHeader>
        {loading && <p>Chargement...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {details && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{details.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {details.image_url && (
                  <img src={details.image_url} alt={details.name} className="w-32 h-32 object-contain mx-auto" />
                )}
                <p className="text-sm text-muted-foreground">{details.brand}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>Calories: {details.energy_kcal_per_100g} kcal/100g</div>
                  <div>Protéines: {details.proteins_per_100g} g</div>
                  <div>Glucides: {details.carbs_per_100g} g</div>
                  <div>Lipides: {details.fat_per_100g} g</div>
                </div>
                <p>Nutriscore: {details.nutriscore?.toUpperCase()}</p>
                {details.ingredients && <p>Ingrédients: {details.ingredients}</p>}
                {details.labels && <p>Labels: {details.labels}</p>}
                {details.additives && <p>Additifs: {details.additives}</p>}
                {details.traces && <p>Traces: {details.traces}</p>}
                {details.countries && <p>Pays: {details.countries}</p>}
              </CardContent>
            </Card>
            <Separator />
            <Button asChild variant="outline" className="w-full">
              <a href={`https://world.openfoodfacts.org/product/${barcode}`} target="_blank" rel="noreferrer">
                Voir sur OpenFoodFacts
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
