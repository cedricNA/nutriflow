import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Scan, Search, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchProductSummary, type ProductSummary } from "@/services/api";
import { ProductDetailsModal } from "./ProductDetailsModal";


interface ScanProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScanProductModal = ({ open, onOpenChange }: ScanProductModalProps) => {
  const { toast } = useToast();
  const [barcode, setBarcode] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("g");
  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mealType, setMealType] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const units = ["g", "ml", "unité(s)"];
  const mealTypes = ["Petit-déjeuner", "Déjeuner", "Dîner", "Collation"];

  const searchProduct = async () => {
    if (!barcode.trim()) {
      toast({
        title: "Code-barres manquant",
        description: "Veuillez saisir ou scanner un code-barres.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const found = await fetchProductSummary(barcode.trim());
      setProduct(found);
      toast({ title: "Produit trouvé", description: found.name });
    } catch (err) {
      setProduct(null);
      toast({
        title: "Produit non trouvé",
        description: String(err),
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const simulateBarcodeScan = () => {
    toast({
      title: "Scan simulé",
      description: "Code-barres détecté, recherche en cours...",
    });
    if (!barcode) {
      setBarcode("12345678");
    }
    searchProduct();
  };

  const calculateNutrition = () => {
    if (!product || !quantity) return null;
    
    const multiplier = Number(quantity) / 100;
    return {
      calories: Math.round((product.energy_kcal_per_100g ?? 0) * multiplier),
      protein: Math.round((product.proteins_per_100g ?? 0) * multiplier * 10) / 10,
      carbs: Math.round((product.carbs_per_100g ?? 0) * multiplier * 10) / 10,
      fat: Math.round((product.fat_per_100g ?? 0) * multiplier * 10) / 10
    };
  };

  const handleAddProduct = () => {
    if (!product || !quantity || !mealType) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez compléter tous les champs.",
        variant: "destructive"
      });
      return;
    }

    const nutrition = calculateNutrition();
    
    toast({
      title: "Produit ajouté avec succès",
      description: `${product.name} - ${quantity}${unit} - ${nutrition?.calories} kcal`,
    });

    // Reset form
    setBarcode("");
    setQuantity("");
    setProduct(null);
    setMealType("");
    onOpenChange(false);
  };

  const nutrition = calculateNutrition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Scanner un produit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scanner / Saisie code-barres */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Code-barres
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="barcode">Code-barres du produit</Label>
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Ex: 3017620422003"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={simulateBarcodeScan}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Simuler un scan
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={searchProduct}
                  disabled={isSearching}
                >
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informations produit */}
          {product && (
            <Card className="shadow-soft border-success/20 bg-gradient-to-br from-success/5 to-success/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-success" />
                  Produit trouvé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-muted-foreground">{product.brand}</p>
                </div>

                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-24 h-24 object-contain mx-auto" />
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-background/50 rounded-lg">
                  <div className="text-center">
                    <div className="font-bold text-nutrition-calories">{product.energy_kcal_per_100g}</div>
                    <div className="text-xs text-muted-foreground">kcal/100g</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-nutrition-protein">{product.proteins_per_100g}g</div>
                    <div className="text-xs text-muted-foreground">Protéines</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-nutrition-carbs">{product.carbs_per_100g}g</div>
                    <div className="text-xs text-muted-foreground">Glucides</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-nutrition-fat">{product.fat_per_100g}g</div>
                    <div className="text-xs text-muted-foreground">Lipides</div>
                  </div>
                </div>
                <div className="text-sm">Nutriscore : {product.nutriscore?.toUpperCase()}</div>
                <Button variant="link" onClick={() => setDetailsOpen(true)}>Plus de détails</Button>
              </CardContent>
            </Card>
          )}

          {/* Quantité et type de repas */}
          {product && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unité</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unitOption) => (
                      <SelectItem key={unitOption} value={unitOption}>{unitOption}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-type">Type de repas</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Résumé nutritionnel calculé */}
          {nutrition && (
            <Card className="shadow-soft border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Valeurs nutritionnelles pour {quantity}{unit}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-calories">{nutrition.calories}</div>
                    <div className="text-sm text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-protein">{nutrition.protein}g</div>
                    <div className="text-sm text-muted-foreground">Protéines</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-carbs">{nutrition.carbs}g</div>
                    <div className="text-sm text-muted-foreground">Glucides</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-nutrition-fat">{nutrition.fat}g</div>
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
              onClick={handleAddProduct}
              disabled={!product || !quantity || !mealType}
            >
              Ajouter au repas
            </Button>
          </div>
        </div>
      </DialogContent>
      {product && (
        <ProductDetailsModal
          barcode={product.barcode}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </Dialog>
  );
};