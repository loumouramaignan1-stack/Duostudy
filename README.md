# 🎓 DuoStudy — Plateforme de Révision Passive & Active Assistée par l'IA

DuoStudy est une application web full-stack innovante d'ingénierie cognitive et de mémorisation espacée (style Duolingo). La plateforme permet aux étudiants de transformer de simples diaporamas de cours (PPTX), documents Word (DOCX),PDFs ou des notes de cours brutes en parcours d'apprentissage riches, gamifiés et structurés en micro-compétences.

---

## 🚀 Fonctionnalités Clés

- **Générateur de Cours par IA (Gemini SDK)** : Décompose n'importe quelle note de cours ou slide importé en une suite d'unités d'apprentissage et de micro-leçons sans aucun saut de difficulté.
- **Micro-exercices Spécifiques (Adaptation Cognitive)** :
  - **Match** (Association Concept-Fiche) pour la mémorisation sémantique directe.
  - **Choice** (Choix multiple homogène hautement plausible) pour la prise de recul active.
  - **True & False** (Vrai ou Faux piégeux) pour tester la subtilité des concepts.
  - **Fill** (Saisie lacunaire) pour l'ancrage terminologique.
- **Mémorisation Espacée (Algorithme SM-2 / Révision des J)** : Analyse les sessions pour recalculer les dates de relance optimales des flashcards d'après l'attention de l'apprenant.
- **Suivi Analytique & Télémétrie GA4** : Mesure de la navigation des utilisateurs en temps réel via des rapports Google Analytics 4 ainsi que l'attribution de variables contextuelles (uid, email, etc.).
- **Panneau Admin Avancé** : Gestion directe des inscrits, configuration globale de l'apprentissage (coefficients, multiplicateurs de points, activation de briques matérielles).
- **Gamification & Rétention** : Système d'expérience (XP), de coeurs régénératifs, de gemmes, de séries de jours quotidiens (Streaks) et de classements régionaux par ligues.

---

## 🛠️ Architecture Technique

Le projet utilise une configuration de pointe full-stack :

1. **Frontend (Client SPA)** :
   - **React 19 & TypeScript 5**
   - **Vite 6** : Compilateur ultra-rapide.
   - **Tailwind CSS v4** : Pour une interface fluide, épurée et moderne.
   - **Motion (Framer Motion)** : Pour les micro-interactions lisses et transitions de pages.
   - **Recharts** : Visualisation des performances et statistiques de révision.
   - **Lucide React** : Collection d'icônes vectorielles.

2. **Backend (Serveur Express)** :
   - **Express.js** : Gère l'ingestion des fichiers lourds et proxy de l'API Gemini de façon sécurisée.
   - **OfficeParser & PDF-Parse** : Moteur d'extraction syntaxique pour le traitement des cours PPTX/DOCX/PDF.
   - **@google/genai SDK** : Connexion serveur-à-serveur avec les modèles Gemini 2.5/1.5 pour sécuriser vos clés d'API sans jamais les divulguer au client web (Zero Browser Leak).
   - **Vite Middleware** : Utilisé au développement pour un rechargement à chaud transparent.

3. **Persistence (Base de données)** :
   - **Firebase Authentication & Firestore Database** : Permet la synchronisation en temps réel des profils d'étudiants, progression et journaux de révision.

---

## 🔑 Configuration des Variables d'Environnement

Créez un fichier `.env` à la racine de votre projet (copié de `.env.example`) :

```env
# Clé API Google Gemini (Obtenue sur Google AI Studio)
GEMINI_API_KEY="AIzaSy..."

# URL racine de l'application
APP_URL="http://localhost:3000"

# Code d'indexation d'audience Google Analytics 4 (Format optionnel : G-XXXXXXXXX)
VITE_GA4_MEASUREMENT_ID="G-HELLOGA4PRO"
```

---

## 💻 Démarrage Local

1. **Installation des dépendances** :
   ```bash
   npm install
   ```

2. **Démarrer en mode Développement** (avec serveur Express + support TypeScript à chaud via `tsx`) :
   ```bash
   npm run dev
   ```
   Rendez-vous sur [http://localhost:3000](http://localhost:3000) !

3. **Générer le build de Production** (Compile le client dans `/dist` et bundle le serveur dans `dist/server.cjs` via `esbuild`) :
   ```bash
   npm run build
   ```

4. **Démarrer le serveur de Production** :
   ```bash
   npm run start
   ```

---

## 🌐 Guide Réseau & DNS : Héberger DuoStudy sur votre domaine `duostudy.fr`

### Pourquoi l'erreur "Aucun élément à afficher" s'affiche sur Google Cloud Run ?

Dans l'interface de Google Cloud Platform (GCP), lorsque vous cherchez à mapper votre domaine `duostudy.fr` via l'onglet **Mappages de domaines personnalisés**, GCP vous renvoie une boîte vide "Aucun élément à afficher".

**La cause :** Votre instance Cloud Run est hébergée sur la région `europe-west2` (Londres). Google Cloud Run **ne supporte pas** l'outil hérité de mappage direct de domaine personnalisé dans cette zone géographique. (Cet outil est restreint à des régions spécifiques comme `us-central1` ou `europe-west1`).

### Comment lier votre nom de domaine `duostudy.fr` à DuoStudy ?

Pour lier votre domaine sans modifier l'emplacement géographique de votre base de données ou de vos conteneurs, voici la méthode **la plus simple, gratuite et performante :**

#### Option A (Recommandée) : Firebase Hosting (Frais d'hébergement : Gratuit)
Puisque DuoStudy utilise déjà l'intégration Firebase pour la base de données Firestore et l'Authentification, vous pouvez utiliser **Firebase Hosting** comme passerelle ultra-rapide sécurisée par SSL (HTTPS d'office) vers votre serveur Cloud Run.

1. **Installer l'interface CLI de Firebase** :
   ```bash
   npm install -g firebase-tools
   ```
2. **Se connecter à votre compte Google** :
   ```bash
   firebase login
   ```
3. **Initialiser Firebase Hosting** dans le dossier du projet :
   ```bash
   firebase init hosting
   ```
   *Choisissez d'associer le projet à votre ID Firebase de DuoStudy existant.*
4. **Configurer la redirection (Rewrites)** :
   Modifiez le fichier `firebase.json` qui s'est généré à la racine pour rediriger le trafic vers votre service Cloud Run :
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": [
         "firebase.json",
         "**/.*",
         "**/node_modules/**"
       ],
       "rewrites": [
         {
           "source": "**",
           "run": {
             "serviceId": "duostudy",
             "region": "europe-west2"
           }
         }
       ]
     }
   }
   ```
5. **Déployer vers Firebase** :
   ```bash
   firebase deploy --only hosting
   ```
6. **Lier `duostudy.fr` sur Firebase** :
   - Allez sur votre **Console Firebase** > Onglet **Hosting** (Hébergement).
   - Cliquez sur **Ajouter un domaine personnalisé**.
   - Entrez `duostudy.fr` (et éventuellement sa version avec `www`).
   - Firebase va vous générer **deux enregistrements TXT** d'authentification pour vérifier que vous êtes bien le propriétaire, puis des **enregistrements de type A** (des adresses IP).
   - Recopiez ces valeurs dans l'interface d'administration de votre hébergeur là où vous avez acquis votre nom de domaine. Au bout de quelques minutes à quelques heures, votre site sera en ligne avec son certificat SSL auto-généré !

---

#### Option B : Le Cloud Load Balancing (Équilibrage de charge GCP)
Si vous préférez rester exclusivement sur la console Google Cloud classique :
1. Créez un **Global HTTPS Load Balancer** (Équilibreur de charge HTTPS global).
2. Créez un **Serverless NEG (Network Endpoint Group)** dirigé vers votre service Cloud Run `duostudy` dans `europe-west2`.
3. Configurez ce NEG comme backend de votre route d'équilibreur.
4. Générez un certificat SSL géré par Google dans les paramètres de l'équilibreur.
5. Pointez l'adresse IP externe publique fournie par le Load Balancer dans la zone DNS de votre hébergeur (enregistrement de type A pour `duostudy.fr`).

---

## 🛡️ DNS Anycast : En avez-vous besoin ?

L'option **DNS Anycast** à 1,09 €/an proposée par votre hébergeur (OVH/Gandi/etc.) est une option DNS :
- **Utilité** : Elle duplique les serveurs qui traduisent l'adresse écrite `duostudy.fr` en adresse IP de serveur, vers plusieurs centres de données dans le monde. Cela réduit d'environ 50ms à 150ms le temps de première résolution pour les visiteurs se trouvant à l'autre bout de la Terre (ex. Amérique, Asie).
- **Recommandation pour DuoStudy** : **Non, vous n'en avez pas besoin en priorité**. Pour un site académique français destiné majoritairement à des francophones, la résolution DNS standard est déjà extrêmement rapide. De plus, si vous optez pour l'hébergement via **Firebase Hosting**, Google gère lui-même un réseau global CDN ultra-rapide doté d'une résolution Anycast native sans frais additionnels. Vous pouvez économiser cette option sereinement !

---

### 📥 Comment exporter ce code vers votre GitHub ?
1. Dans l'onglet supérieur droit ou le menu latéral gauche de **Google AI Studio**, ouvrez le volet de configuration (**Settings** ou la roue crantée).
2. Repérez l'option **"Export"** ou **"Sync with GitHub"**.
3. Autorisez votre compte GitHub et choisissez le dépôt de votre choix ou téléchargez le projet sous forme d'archive **ZIP** complète, puis poussez-la avec l'outil Git standard :
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit of DuoStudy platform"
   git branch -M main
   git remote add origin https://github.com/votre-user/duostudy.git
   git push -u origin main
   ```
