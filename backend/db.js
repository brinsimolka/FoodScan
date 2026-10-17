const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "data.json");
let data = { users: [], meals: [], nextUserId: 1, nextMealId: 1 };

try {
  data = { ...data, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
} catch {
  /* premier lancement : fichier absent */
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = { data, save };
