const axios = require("axios");

const BASE_URL = "https://world.openfoodfacts.org/api/v2/product";
const round1 = (n) => Math.round(n * 10) / 10;

function parseServing(raw) {
  const m = typeof raw === "string" ? raw.match(/([\d.]+)\s*g/i) : null;
  return m ? parseFloat(m[1]) : null;
}

/** Retourne les macros pour une portion, ou null si produit introuvable. */
async function lookupBarcode(barcode) {
  const { data } = await axios.get(`${BASE_URL}/${encodeURIComponent(barcode)}.json`, { timeout: 8000 });
  if (!data || data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments || {};
  const kcal = n["energy-kcal_100g"] ?? n["energy-kcal"];
  if (kcal === undefined || kcal === null) return null;

  const grams = parseServing(p.serving_size) ?? 100;
  const k = grams / 100;
  const per = (key) => (n[key] !== undefined ? round1(n[key] * k) : undefined);

  return {
    foodName: p.product_name || p.generic_name || "Produit inconnu",
    brand: p.brands || "",
    servingSizeGrams: grams,
    calories: round1(kcal * k),
    carbsG: per("carbohydrates_100g") ?? 0,
    proteinG: per("proteins_100g") ?? 0,
    fatG: per("fat_100g") ?? 0,
    sugarG: per("sugars_100g"),
    fiberG: per("fiber_100g"),
    imageUrl: p.image_front_url || p.image_url,
  };
}

module.exports = { lookupBarcode };
