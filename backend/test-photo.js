// Usage : node test-photo.js photo.jpg
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { estimateMealFromPhoto } = require("./services/mealVision.service");
const file = process.argv[2];
if (!file) { console.log("Usage : node test-photo.js <photo.jpg>"); process.exit(1); }
const mime = path.extname(file).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
estimateMealFromPhoto(fs.readFileSync(file), mime)
  .then((r) => console.log(JSON.stringify(r, null, 2)))
  .catch((e) => console.error("Erreur :", e.message, e.response?.data ? JSON.stringify(e.response.data) : ""));
