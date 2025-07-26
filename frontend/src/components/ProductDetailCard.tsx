import { BadgeCheck, AlertCircle, Leaf, Milk, Wheat, Info } from "lucide-react";
import type { ProductDetails } from "@/services/api";

interface ProductDetailCardProps {
  product: ProductDetails;
}

export function ProductDetailCard({ product }: ProductDetailCardProps) {
  if (!product) return null;

  const labels = product.labels_tags?.split(",").filter(Boolean) ?? [];
  const allergens = product.allergens_tags?.split(",").filter(Boolean) ?? [];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-xl mx-auto">
      <div className="flex flex-col items-center gap-2">
        {product.image_url && (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-28 w-auto rounded-lg shadow"
          />
        )}
        <h2 className="font-bold text-2xl mt-2 text-center">{product.name}</h2>
        {product.brand && <div className="text-gray-600 text-base">{product.brand}</div>}
      </div>

      <div className="flex flex-wrap justify-between mt-4 mb-2 gap-x-6 gap-y-1 text-sm">
        {product.quantity && (
          <div>
            <span className="font-semibold">Quantité :</span> {product.quantity}
          </div>
        )}
        {product.serving_size && (
          <div>
            <span className="font-semibold">Portion :</span> {product.serving_size}
          </div>
        )}
        {product.packaging && (
          <div>
            <span className="font-semibold">Emballage :</span> {product.packaging}
          </div>
        )}
        {product.manufacturing_places && (
          <div>
            <span className="font-semibold">Fabriqué à :</span> {product.manufacturing_places}
          </div>
        )}
        {product.countries && (
          <div>
            <span className="font-semibold">Pays :</span> {product.countries}
          </div>
        )}
      </div>

      <div className="border-t my-3"></div>

      <div className="flex flex-wrap justify-between gap-y-2 text-base">
        {product.energy_kcal_per_100g !== undefined && (
          <div>
            <b>Calories :</b> {product.energy_kcal_per_100g} kcal/100g
          </div>
        )}
        {product.proteins_per_100g !== undefined && (
          <div>
            <b>Protéines :</b> {product.proteins_per_100g} g
          </div>
        )}
        {product.carbs_per_100g !== undefined && (
          <div>
            <b>Glucides :</b> {product.carbs_per_100g} g
          </div>
        )}
        {product.sugars_per_100g !== undefined && (
          <div>
            <b>Sucres :</b> {product.sugars_per_100g} g
          </div>
        )}
        {product.fat_per_100g !== undefined && (
          <div>
            <b>Lipides :</b> {product.fat_per_100g} g
          </div>
        )}
        {product.salt_per_100g !== undefined && (
          <div>
            <b>Sel :</b> {product.salt_per_100g} g
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-4 items-center">
        {product.nutriscore_grade && (
          <img
            src={`/nutriscore/${product.nutriscore_grade}.svg`}
            alt={`NutriScore ${product.nutriscore_grade.toUpperCase()}`}
            className="h-10"
          />
        )}
        {product.ecoscore_grade && (
          <img
            src={`/ecoscore/${product.ecoscore_grade}.svg`}
            alt={`EcoScore ${product.ecoscore_grade.toUpperCase()}`}
            className="h-10"
          />
        )}
        {product.nova_group && (
          <img
            src={`/nova/${product.nova_group}.svg`}
            alt={`NOVA ${product.nova_group}`}
            className="h-10"
          />
        )}
      </div>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {labels.map((l, i) => (
            <span
              key={i}
              className="bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1 text-xs"
            >
              <BadgeCheck className="h-4 w-4" /> {l.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Allergens */}
      {allergens.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {allergens.map((a, i) => {
            let icon: React.ReactNode = <AlertCircle className="h-4 w-4" />;
            const al = a.toLowerCase();
            if (al.includes("milk")) icon = <Milk className="h-4 w-4" />;
            if (al.includes("wheat") || al.includes("gluten")) icon = <Wheat className="h-4 w-4" />;
            if (al.includes("egg")) icon = <Info className="h-4 w-4" />;
            if (al.includes("vegan")) icon = <Leaf className="h-4 w-4" />;
            return (
              <span
                key={i}
                className="bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1 text-xs"
              >
                {icon} {a.trim()}
              </span>
            );
          })}
        </div>
      )}

      {/* Ingrédients */}
      {product.ingredients_text_fr && (
        <div className="mt-4">
          <b>Ingrédients :</b>
          <div className="text-sm mt-1 text-gray-700 whitespace-pre-line">
            {product.ingredients_text_fr}
          </div>
          {Array.isArray(product.ingredients_list) && (
            <ul className="list-disc ml-6 text-sm text-gray-600 mt-1">
              {product.ingredients_list.map((ing, i) => (
                <li key={i}>{typeof ing === "string" ? ing : ing.text}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Autres infos */}
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        {product.categories && (
          <div>
            <b>Catégories :</b> {product.categories}
          </div>
        )}
        {product.traces_tags && (
          <div>
            <b>Traces :</b> {product.traces_tags}
          </div>
        )}
        {product.additives_tags && (
          <div>
            <b>Additifs :</b> {product.additives_tags}
          </div>
        )}
      </div>

      <a
        href={`https://fr.openfoodfacts.org/produit/${product.barcode}`}
        target="_blank"
        rel="noopener"
        className="block mt-6 px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-xl text-center hover:bg-blue-200 transition"
      >
        Voir sur OpenFoodFacts
      </a>
    </div>
  );
}
