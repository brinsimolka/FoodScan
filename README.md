# FoodScan

Scanne un aliment (code-barres ou photo) et obtiens calories, glucides, protéines et lipides.

- **Code-barres** : base gratuite Open Food Facts
- **Photo** : IA Gemini (gratuit, clé sur https://aistudio.google.com/apikey)

Dossiers : `backend/` (serveur Node) et `mobile/` (app Expo SDK 57).

## Fonctionnalités

- Inscription et connexion (photo de profil facultative, modifiable depuis l'accueil)
- Scan d'un code-barres ou d'une photo de repas
- Choix de la portion (de 0,25× à 2×) avec recalcul des valeurs nutritionnelles
- Confirmation « Tu as mangé ça ? » : l'aliment n'est ajouté que si la réponse est oui
- Accueil avec les calories et macros du jour
- Historique par date, avec le total de kcal de chaque journée et suppression d'un aliment
- Trois langues : français, anglais et arabe (avec lecture de droite à gauche)
- Déconnexion avec confirmation

## Technologies

| Partie | Outils |
|---|---|
| Mobile | React Native 0.86, Expo 57, TypeScript, `expo-camera`, `expo-image-picker`, `expo-secure-store`, axios |
| Backend | Node.js, Express, multer, cors, dotenv |
| Sécurité | `bcryptjs` (mots de passe hachés), `jsonwebtoken` (session valable 30 jours) |
| Services externes | Open Food Facts (gratuit, sans clé), Google Gemini (clé gratuite) |

## Architecture

```
FoodScan/
├── backend/                         API Node.js (Express)
│   ├── server.js                    Routes : authentification, scan, repas
│   ├── db.js                        Stockage dans data.json (comptes et repas)
│   ├── services/
│   │   ├── openFoodFacts.service.js Recherche d'un code-barres, valeurs ramenées à la portion
│   │   └── mealVision.service.js    Analyse d'une photo de repas avec Gemini
│   ├── test-barcode.js              Test du scan code-barres sans téléphone
│   ├── test-photo.js                Test du scan photo sans téléphone
│   └── .env.example                 Modèle de configuration
└── mobile/                          Application React Native (Expo)
    ├── App.tsx                      Navigation et gestion de la session
    ├── screens/                     Auth, Home, Scan, Result, History
    ├── components/                  Avatar, sélecteur de langue, choix de la photo de profil
    ├── services/                    api.ts (client axios + jeton), nutritionApi.ts
    ├── i18n.tsx                     Français, anglais, arabe (RTL)
    └── theme.ts                     Couleurs (thème vert)
```

## 1. Backend (terminal 1)

```
cd backend
npm install
copy .env.example .env
```
Ouvre `.env` et colle ta clé dans `GEMINI_API_KEY`. Puis :
```
node server.js
```
Tu dois voir : `FoodScan backend : http://0.0.0.0:4000`. Laisse ce terminal ouvert.

Variables du fichier `.env` :

| Variable | Rôle |
|---|---|
| `GEMINI_API_KEY` | Ta clé Gemini (obligatoire pour le scan photo) |
| `GEMINI_MODEL` | Modèle utilisé (par défaut `gemini-3-flash-preview`) |
| `JWT_SECRET` | Secret de signature des sessions : mets une valeur longue et aléatoire |
| `PORT` | Port du serveur (par défaut `4000`) |

Test rapide sans téléphone :
```
node test-barcode.js 3017620422003
node test-photo.js ma-photo.jpg
```

## 2. Mobile (terminal 2, séparé)

1. Trouve l'IP de ton PC : `ipconfig` → "Adresse IPv4".
2. Ouvre `mobile/services/api.ts` et remplace `SERVER_IP` par cette IP.
3. Puis :
```
cd mobile
npm install
npx expo start -c
```
4. Téléphone et PC sur le même WiFi. Scanne le QR code (Expo Go sur Android ; sur iPhone, appareil photo puis ouvrir dans Expo Go, qui doit être en SDK 57).

## Parcours
Connexion → Accueil → Scanner → code-barres ou photo → résultat (portion de 0,25× à 2×) → « Tu as mangé ça ? » → Oui : ajouté à l'historique, Non : rien n'est enregistré → totaux du jour mis à jour.

## Routes de l'API

Toutes les routes sont préfixées par `/api`. Sauf l'inscription et la connexion, elles nécessitent l'en-tête `Authorization: Bearer <jeton>`.

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/auth/register` | Inscription (nom, e-mail, mot de passe de 6 caractères minimum, photo facultative) |
| POST | `/auth/login` | Connexion, renvoie un jeton |
| GET | `/auth/me` | Vérifie la session |
| PUT | `/auth/photo` | Change la photo de profil |
| POST | `/scan-barcode` | Scan d'un code-barres (Open Food Facts) |
| POST | `/scan-photo` | Scan d'une photo de repas (Gemini) |
| POST | `/meals` | Ajoute un repas à l'historique |
| GET | `/meals` | Liste les repas de l'utilisateur |
| DELETE | `/meals/:id` | Supprime un repas |

## Sécurité

- Les mots de passe sont hachés avec **bcrypt** et ne sont jamais stockés en clair.
- La session est un **JWT** valable 30 jours, conservé sur le téléphone avec `expo-secure-store`.
- Les clés et secrets sont lus depuis `backend/.env`, qui n'est **jamais versionné** (voir `.gitignore`). Ne commite jamais ce fichier.
- Les données des utilisateurs (`backend/data.json`) sont aussi exclues du dépôt.

## Limites connues
- L'appli ne marche que si le téléphone et le PC sont sur le même WiFi, avec la bonne IP dans `api.ts`. Pour l'utiliser ailleurs, il faudrait héberger le backend en ligne.
- Les données sont dans un simple fichier JSON (`data.json`) : elles survivent aux redémarrages du serveur, mais c'est suffisant pour un projet ou une démo, pas pour beaucoup d'utilisateurs.
- Open Food Facts est faible sur les produits locaux (tunisiens) : utilise la photo dans ce cas.
- La photo est une estimation, pas une mesure : regarde le score de confiance.
- Il n'y a pas de récupération de mot de passe : un mot de passe perdu oblige à recréer le compte.

## Pistes d'amélioration
- Héberger le backend (Render, Railway, etc.) et utiliser une vraie base de données (PostgreSQL ou MongoDB)
- Objectifs caloriques personnalisés et graphiques d'évolution
- Récupération de mot de passe par e-mail

## Auteure

**Molka Brinsi**, étudiante en Master Data Science for Business (ISG Tunis) · [GitHub](https://github.com/brinsimolka)