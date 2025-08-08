import { useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  AlertCircle,
  Leaf,
  Milk,
  Wheat,
  Info,
  Carrot,
  TreePalm,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ProductDetails } from "@/services/api";

interface ProductDetailCardProps {
  product: ProductDetails;
}

export function ProductDetailCard({ product }: ProductDetailCardProps) {
  const [openScore, setOpenScore] = useState<string | null>(null);

  if (!product) return null;

  const labels = product.labels_tags?.split(",").filter(Boolean) ?? [];
  const allergens = product.allergens_tags?.split(",").filter(Boolean) ?? [];

  const getFlag = (country?: string) => {
    if (!country) return "";
    const map: Record<string, string> = {
      France: "🇫🇷",
      Belgique: "🇧🇪",
      Luxembourg: "🇱🇺",
      "États-Unis": "🇺🇸",
      Italie: "🇮🇹",
      Espagne: "🇪🇸",
    };
    return map[country.trim()] ?? "";
  };

  const scores = [
    {
      type: "nutriscore",
      value: product.nutriscore_grade?.toUpperCase(),
      color: "bg-yellow-400",
      desc: "Le NutriScore évalue la qualité nutritionnelle globale d’un aliment (A à E).",
      img: product.nutriscore_grade
        ? `/nutriscore/${product.nutriscore_grade}.svg`
        : undefined,
      label: "NutriScore",
    },
    {
      type: "ecoscore",
      value: product.ecoscore_grade?.toUpperCase(),
      color: "bg-green-300",
      desc: "L’EcoScore renseigne sur l’impact environnemental du produit (A à E).",
      img: product.ecoscore_grade
        ? `/ecoscore/${product.ecoscore_grade}.svg`
        : undefined,
      label: "EcoScore",
    },
    {
      type: "nova",
      value: product.nova_group?.toString(),
      color: "bg-blue-300",
      desc: "Le groupe NOVA indique le niveau de transformation (1 = brut, 4 = ultra-transformé).",
      img: product.nova_group ? `/nova/${product.nova_group}.svg` : undefined,
      label: "NOVA",
    },
  ];

  const countries = product.countries
    ? product.countries.split(",").map((c) => c.trim())
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-white p-6 rounded-2xl shadow-lg max-w-xl mx-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Détails produit ${product.name}`}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          {product.image_front_url ? (
            <img
              src={product.image_front_url}
              alt={`${product.name} - face avant`}
              aria-label={`${product.name} face avant`}
              className="h-28 w-auto rounded-lg shadow"
            />
          ) : (
            product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                aria-label={product.name}
                className="h-28 w-auto rounded-lg shadow"
              />
            )
          )}
          {product.image_ingredients_url && (
            <img
              src={product.image_ingredients_url}
              alt="Ingrédients"
              aria-label="Image des ingrédients"
              className="h-28 w-auto rounded-lg shadow"
            />
          )}
          {product.image_nutrition_url && (
            <img
              src={product.image_nutrition_url}
              alt="Infos nutritionnelles"
              aria-label="Image des informations nutritionnelles"
              className="h-28 w-auto rounded-lg shadow"
            />
          )}
        </div>
        <h2 className="font-bold text-2xl mt-2 text-center">{product.name}</h2>
        {product.brand && (
          <div className="text-gray-600 text-base">{product.brand}</div>
        )}
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
            <span className="font-semibold">Fabriqué à :</span>
            {product.manufacturing_places.includes("France") ? (
              <span
                className="text-green-600 font-semibold ml-1"
                aria-label="Fabriqué en France"
              >
                🇫🇷 {product.manufacturing_places}
              </span>
            ) : (
              <span className="ml-1">{product.manufacturing_places}</span>
            )}
          </div>
        )}
        {countries.length > 0 && (
          <div>
            <span className="font-semibold">Pays :</span>
            {countries.map((c, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-1 ml-2 ${
                  c.includes("France") ? "text-green-600 font-semibold" : ""
                }`}
                aria-label={`Pays : ${c}`}
              >
                <span>{getFlag(c)}</span>
                <span>{c}</span>
              </span>
            ))}
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

      {/* Scores avec tooltip */}
      <TooltipProvider delayDuration={200}>
        <div className="flex gap-3 mt-4 items-center">
          {scores.map(
            (s, i) =>
              s.value && (
                <Tooltip
                  key={s.type}
                  open={openScore === s.type}
                  onOpenChange={(o) => setOpenScore(o ? s.type : null)}
                >
                  <TooltipTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                      whileTap={{ scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      className={`relative px-3 py-1 rounded-lg font-bold shadow-sm cursor-pointer ${s.color} focus:outline-blue-400`}
                      aria-label={s.label}
                      tabIndex={0}
                      onClick={() =>
                        setOpenScore(openScore === s.type ? null : s.type)
                      }
                    >
                      {s.img ? (
                        <img
                          src={s.img}
                          alt={s.label}
                          aria-label={s.label}
                          className="h-7 inline"
                        />
                      ) : (
                        s.value
                      )}
                      <span className="ml-1">{s.value}</span>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="text-xs"
                    side="top"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Info className="h-4 w-4 text-blue-400" />
                      <b>{s.label}</b>
                    </div>
                    <div>{s.desc}</div>
                  </TooltipContent>
                </Tooltip>
              )
          )}
        </div>
      </TooltipProvider>

      {/* Labels */}
      {labels.length > 0 && (
        <motion.div className="flex flex-wrap gap-2 mt-3">
          {labels.map((l, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className="bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1 text-xs"
              aria-label={`Label ${l.trim()}`}
            >
              <BadgeCheck className="h-4 w-4" /> {l.trim()}
            </motion.span>
          ))}
        </motion.div>
      )}

      {/* Allergens */}
      {allergens.length > 0 && (
        <motion.div className="flex flex-wrap gap-2 mt-2">
          {allergens.map((a, i) => {
            let icon: React.ReactNode = <AlertCircle className="h-4 w-4" />;
            const al = a.toLowerCase();
            if (al.includes("milk")) icon = <Milk className="h-4 w-4" />;
            if (al.includes("wheat") || al.includes("gluten")) icon = <Wheat className="h-4 w-4" />;
            if (al.includes("egg")) icon = <Info className="h-4 w-4" />;
            if (al.includes("vegan")) icon = <Leaf className="h-4 w-4" />;
            return (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + 0.05 * i }}
                className="bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1 text-xs"
                aria-label={`Allergène ${a.trim()}`}
              >
                {icon} {a.trim()}
              </motion.span>
            );
          })}
        </motion.div>
      )}

      {/* Ingrédients */}
      {product.ingredients_text_fr && (
        <div className="mt-4">
          <b>Ingrédients :</b>
          <div className="text-sm mt-1 text-gray-700 whitespace-pre-line">
            {product.ingredients_text_fr}
          </div>
          {Array.isArray(product.ingredients_list) && (
            <ul className="list-disc ml-6 text-sm text-gray-600 mt-1 space-y-1">
              {product.ingredients_list.map((ing, i) => {
                const text = typeof ing === "string" ? ing : ing.text;
                const vegan =
                  typeof ing !== "string" && ing.vegan === "yes";
                const vegetarian =
                  typeof ing !== "string" && ing.vegetarian === "yes";
                const palm =
                  typeof ing !== "string" &&
                  (ing.from_palm_oil === "yes" || ing.palm_oil === "yes");
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * i }}
                    className="flex items-center gap-2"
                  >
                    <span>{text}</span>
                    {vegan && (
                      <Leaf
                        className="h-4 w-4 text-green-600"
                        aria-label="Vegan"
                      />
                    )}
                    {vegetarian && (
                      <Carrot
                        className="h-4 w-4 text-green-600"
                        aria-label="Végétarien"
                      />
                    )}
                    {palm && (
                      <TreePalm
                        className="h-4 w-4 text-orange-600"
                        aria-label="Contient huile de palme"
                      />
                    )}
                  </motion.li>
                );
              })}
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
        aria-label="Voir sur OpenFoodFacts"
      >
        Voir sur OpenFoodFacts
      </a>
    </motion.div>
  );
}
