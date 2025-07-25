import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {details.image_url && (
                    <img src={details.image_url} alt={details.name} className="w-32 h-32 object-contain mx-auto" />
                  )}
                  <div className="flex-1 space-y-2 text-sm">
                    <p className="text-muted-foreground">{details.brand}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {details.quantity && <div>Quantité : {details.quantity}</div>}
                      {details.serving_size && <div>Portion : {details.serving_size}</div>}
                      {details.packaging && <div>Emballage : {details.packaging}</div>}
                      {details.manufacturing_places && <div>Fabriqué à : {details.manufacturing_places}</div>}
                      {details.countries && <div>Pays : {details.countries}</div>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Calories: {details.energy_kcal_per_100g} kcal/100g</div>
                  <div>Protéines: {details.proteins_per_100g} g</div>
                  <div>Glucides: {details.carbs_per_100g} g</div>
                  <div>Lipides: {details.fat_per_100g} g</div>
                  {details.sugars_per_100g !== undefined && <div>Sucres: {details.sugars_per_100g} g</div>}
                  {details.salt_per_100g !== undefined && <div>Sel: {details.salt_per_100g} g</div>}
                </div>

                <div className="flex flex-wrap gap-2">
                  {details.nutriscore_grade && (
                    <Badge variant="secondary">NutriScore {details.nutriscore_grade.toUpperCase()}</Badge>
                  )}
                  {details.ecoscore_grade && (
                    <Badge variant="secondary">EcoScore {details.ecoscore_grade.toUpperCase()}</Badge>
                  )}
                  {details.nova_group && (
                    <Badge variant="secondary">NOVA {details.nova_group}</Badge>
                  )}
                </div>

                {details.labels_tags && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    {details.labels_tags.split(',').map((l) => (
                      <Badge key={l.trim()} variant="outline">{l.trim()}</Badge>
                    ))}
                  </div>
                )}

                {details.additives_tags && (
                  <p className="text-sm">Additifs : {details.additives_tags}</p>
                )}
                {details.allergens_tags && (
                  <p className="text-sm">Allergènes : {details.allergens_tags}</p>
                )}
                {details.traces_tags && (
                  <p className="text-sm">Traces : {details.traces_tags}</p>
                )}
                {details.categories && (
                  <p className="text-sm">Catégories : {details.categories}</p>
                )}
                {details.ingredients_text_fr && (
                  <p className="text-sm whitespace-pre-wrap">{details.ingredients_text_fr}</p>
                )}
                {details.ingredients_list && details.ingredients_list.length > 0 && (
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {details.ingredients_list.map((ing, idx) => {
                      const text = typeof ing === 'string' ? ing : ing.text ?? ''
                      const key = typeof ing === 'string' ? ing : ing.id ?? idx
                      return (
                        <li key={key}>{text}</li>
                      )
                    })}
                  </ul>
                )}
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
