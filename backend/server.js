require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { lookupBarcode } = require("./services/openFoodFacts.service");
const { estimateMealFromPhoto } = require("./services/mealVision.service");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { data, save } = require("./db");

const app = express();
app.use(cors());
app.use(express.json({ limit: "3mb" }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || "foodscan-dev-secret-change-me";
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, photo: u.photo || null });
const validPhoto = (p) => typeof p === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(p) && p.length < 2_000_000;

const sign = (u) => jwt.sign({ uid: u.id }, JWT_SECRET, { expiresIn: "30d" });

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  try {
    const { uid } = jwt.verify(h.replace(/^Bearer /, ""), JWT_SECRET);
    const user = data.users.find((u) => u.id === uid);
    if (!user) throw new Error("no user");
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED" });
  }
}

app.get("/", (req, res) => res.json({ status: "ok", app: "FoodScan" }));

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, photo } = req.body || {};
  const mail = String(email || "").trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(mail)) return res.status(400).json({ error: "INVALID_INPUT" });
  if (String(password || "").length < 6) return res.status(400).json({ error: "PASSWORD_TOO_SHORT" });
  if (data.users.some((u) => u.email === mail)) return res.status(409).json({ error: "EMAIL_TAKEN" });
  const user = { id: data.nextUserId++, name: String(name).trim(), email: mail, passwordHash: await bcrypt.hash(password, 10), photo: validPhoto(photo) ? photo : null };
  data.users.push(user);
  save();
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const mail = String(email || "").trim().toLowerCase();
  const user = data.users.find((u) => u.email === mail);
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  }
  res.json({ token: sign(user), user: publicUser(user) });
});

app.put("/api/auth/photo", auth, (req, res) => {
  const { photo } = req.body || {};
  if (photo !== null && !validPhoto(photo)) return res.status(400).json({ error: "INVALID_PHOTO" });
  req.user.photo = photo;
  save();
  res.json({ user: publicUser(req.user) });
});

app.get("/api/auth/me", auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.post("/api/scan-barcode", auth, async (req, res) => {
  try {
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ error: "barcode requis" });
    const preview = await lookupBarcode(barcode);
    if (!preview) return res.status(404).json({ error: "PRODUCT_NOT_FOUND" });
    res.json({ source: "barcode", barcode, preview });
  } catch (e) {
    console.error("scan-barcode:", e.message);
    res.status(502).json({ error: "BARCODE_LOOKUP_FAILED", message: e.message });
  }
});

app.post("/api/scan-photo", auth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "photo requise" });
    const e = await estimateMealFromPhoto(req.file.buffer, req.file.mimetype);
    res.json({
      source: "photo",
      preview: {
        foodName: e.foodName, servingSizeGrams: null,
        calories: e.calories, carbsG: e.carbsG, proteinG: e.proteinG, fatG: e.fatG,
        sugarG: e.sugarG, fiberG: e.fiberG,
        aiConfidence: e.confidence, aiRawItems: e.items, notes: e.notes,
      },
    });
  } catch (e) {
    console.error("scan-photo:", e.message);
    res.status(502).json({ error: "PHOTO_ESTIMATION_FAILED", message: e.message });
  }
});

app.post("/api/meals", auth, (req, res) => {
  const b = req.body || {};
  if (!b.foodName) return res.status(400).json({ error: "foodName requis" });
  const mult = b.portionMultiplier || 1;
  const r = (v) => Math.round((Number(v) || 0) * mult * 10) / 10;
  const meal = {
    id: data.nextMealId++, userId: req.user.id, loggedAt: new Date().toISOString(),
    source: b.source, foodName: b.foodName,
    calories: r(b.calories), carbsG: r(b.carbsG), proteinG: r(b.proteinG), fatG: r(b.fatG),
  };
  data.meals.push(meal);
  save();
  res.status(201).json({ meal });
});

app.get("/api/meals", auth, (req, res) => {
  const meals = data.meals
    .filter((m) => m.userId === req.user.id)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  res.json({ meals });
});

app.delete("/api/meals/:id", auth, (req, res) => {
  const idx = data.meals.findIndex((m) => m.id === Number(req.params.id) && m.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "NOT_FOUND" });
  data.meals.splice(idx, 1);
  save();
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => console.log(`FoodScan backend : http://0.0.0.0:${PORT}`));
