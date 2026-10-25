# Agent Studio · Clark

Interface web et API TypeScript pour expérimenter une boucle d’agent avec outils, observer ses étapes et exporter les résultats JSON. Extension du POC fourni ; aucune affiliation à un fournisseur.

## Windows — VS Code / PowerShell
Extraire le ZIP puis ouvrir **le dossier qui contient package.json** dans VS Code. Node.js 22 ou supérieur. Python et Streamlit ne sont pas utilisés.

Exécuter chaque commande séparément :
```powershell
npm.cmd install
npm.cmd run build
npm.cmd start
```
Ouvrir **http://127.0.0.1:3000/** dans Chrome ou Edge sur le même ordinateur.
Garder le terminal actif ; Ctrl+C arrête le serveur. Lancer les autres commandes dans un deuxième terminal.
`npm.cmd` évite le blocage de npm.ps1 par PowerShell.

En cas de problème :
```powershell
Test-Path .\package.json
curl.exe --noproxy "*" http://127.0.0.1:3000/health
```
Le premier résultat doit être True. Si False, ouvrir le sous-dossier du ZIP contenant package.json. Si health répond et le navigateur intégré échoue, utiliser Chrome ou Edge directement.

## Fonctions
Sélection d’agent, exemples, question, chargement, affichage de réponse, durée, appels aux outils et export JSON. Contenus affichés avec textContent. Assets locaux, pas de CDN ni compilation frontend.
La création de nouveaux agents reste déclarative dans src/index.ts ; aucune création depuis l’interface.

## Tests
```powershell
npm.cmd test
node dist/index.js demo
```
Le jeu historique retourne 3/4 avec le mock. La capitale de la France est une limite volontaire du simulateur, pas une erreur serveur. Le score historique repose sur une inclusion de texte, pas une évaluation scientifique.

## Modèle réel optionnel
Le mock fonctionne sans clé, sans réseau et sans coût d’API. Pour un fournisseur compatible avec le format chat/completions, configurer dans le terminal **avant** npm.cmd start :
```powershell
$env:LLM_BASE_URL = "https://ADRESSE_DU_FOURNISSEUR/v1"
$env:LLM_API_KEY = "VOTRE_CLE"
$env:LLM_MODEL = "NOM_EXACT_DU_MODELE"
npm.cmd start
```
Remplacer ces exemples par les paramètres du fournisseur. Aucun fichier .env n’est chargé automatiquement. Ne jamais publier une clé. Les trois variables sont nécessaires ; sinon le mock reste actif. Délai réseau maximal de 15 secondes par appel ; plusieurs étapes possibles. Aucun vrai fournisseur testé dans cette livraison.

## Docker
Docker Desktop doit être démarré.
```powershell
docker compose up --build -d
docker compose ps
docker compose logs --tail 50
```
Ouvrir http://127.0.0.1:3000/. Arrêter : `docker compose down`.
Si port occupé, arrêter le serveur Node local ou modifier le port à gauche dans compose.yaml, par exemple 3001:3000 et ouvrir localhost:3001.

## GitHub
Créer un dépôt vide agent-studio, puis depuis ce dossier :
```powershell
git init
git add .
git status
git commit -m "Ajoute Agent Studio avec interface web"
git branch -M main
git remote add origin https://github.com/clark94/agent-studio.git
git push -u origin main
```
Vérifier que secrets et node_modules sont exclus. Publier package-lock.json et public/.

## Déploiement HTTPS — Render
Créer un Web Service depuis le dépôt GitHub. Runtime Docker, Dockerfile ./Dockerfile, health /health. Root Directory vide si package.json est à la racine. Si vous publiez le dossier parent, indiquer le sous-dossier contenant Dockerfile. Le serveur lit PORT et HOST ; l’image écoute sur 0.0.0.0. Render fournit l’adresse publique HTTPS. Le fichier render.yaml propose les paramètres équivalents ; vérifier le tarif du service avant création.
Alternative runtime Node : build `npm ci --include=dev && npm run build`, start `npm start`, variable HOST=0.0.0.0, health /health.
Documentation : https://render.com/docs/deploy-node-express-app et https://render.com/docs/deploys

## Limites et validation
Prototype : pas d’authentification, pas de quota par utilisateur, pas de stockage ni d’historique durable, pas de MCP, pas de RAG. Limite globale de quatre requêtes agent simultanées par processus ; corps limité à 16 KiB ; question limitée à 2000 caractères. Ces limites ne remplacent pas une protection contre les abus.
Ne connecter aucune clé payante à une instance publique avant authentification et quotas. L’outil calculateur hérité utilise Function avec une liste restrictive de caractères ; préférer un parseur arithmétique dédié avant un usage sensible.
Compilation, API et tests HTTP vérifiés dans l’environnement Linux Node 24 de préparation. Détail des contrôles et limites dans VALIDATION.md. Docker et déploiement hébergé non exécutés ici. Pas de certification de sécurité ou conformité.
