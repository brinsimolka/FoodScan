// Usage : node test-barcode.js 3017620422003
const { lookupBarcode } = require("./services/openFoodFacts.service");
const code = process.argv[2];
if (!code) { console.log("Usage : node test-barcode.js <code-barres>"); process.exit(1); }
lookupBarcode(code).then((r) => console.log(r || "Introuvable")).catch((e) => console.error(e.message));
