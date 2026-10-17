const axios = require("axios");

const PROMPT = `You are a nutrition estimation assistant. Users make real diet decisions from your numbers, so accuracy matters more than sounding confident.

STEP 1 - Scale: look for reference objects (dinner plate ~26-28cm, fork ~19-20cm, spoon ~15cm, smartphone ~14-16cm) to judge the real portion. If none is visible, say so in "notes" and lower confidence.
STEP 2 - Identify each food, sauce and topping separately (sauces and oils are the main hidden calories).
STEP 3 - Estimate grams and macros per item using the scale.
STEP 4 - Score confidence honestly:
  0.85-1.0  clear photo, reliable size reference, simple recognizable dish
  0.6-0.85  good visibility but sauce / mixed ingredients / partial occlusion
  0.3-0.6   poor light, no size reference, or hidden composition
  <0.3      too unclear to identify
Do not raise confidence just because you produced precise-looking numbers.

Respond with ONLY valid JSON in this exact shape:
{"items":[{"label":"grilled chicken breast","estimatedGrams":150}],
 "totals":{"calories":380,"carbsG":12,"proteinG":45,"fatG":14,"sugarG":3,"fiberG":2},
 "confidence":0.7,
 "notes":"Which reference object you used and which items are most uncertain."}`;

async function estimateMealFromPhoto(buffer, mimeType = "image/jpeg") {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY manquante (voir .env.example)");
  }
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await axios.post(
    url,
    {
      contents: [{ parts: [
        { text: PROMPT + "\n\nEstimate the nutrition content of this meal photo." },
        { inline_data: { mime_type: mimeType, data: buffer.toString("base64") } },
      ] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000, responseMimeType: "application/json" },
    },
    { timeout: 30000 }
  );

  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Réponse vide de Gemini");

  let parsed;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("Réponse IA coupée ou invalide : " + text.slice(0, 120));
  }

  const items = parsed.items || [];
  const t = parsed.totals || {};
  return {
    foodName: items.map((i) => i.label).join(", ") || "Repas non identifié",
    items,
    calories: t.calories ?? 0,
    carbsG: t.carbsG ?? 0,
    proteinG: t.proteinG ?? 0,
    fatG: t.fatG ?? 0,
    sugarG: t.sugarG,
    fiberG: t.fiberG,
    confidence: parsed.confidence ?? 0.5,
    notes: parsed.notes,
  };
}

module.exports = { estimateMealFromPhoto };
