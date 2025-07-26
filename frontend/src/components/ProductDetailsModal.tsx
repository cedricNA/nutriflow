import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchProductDetails, type ProductDetails } from "@/services/api";
import { ProductDetailCard } from "./ProductDetailCard";

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
          <ProductDetailCard product={details} />
        )}
      </DialogContent>
    </Dialog>
  );
};
