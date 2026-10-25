# Validation de la livraison

- Environnement : Linux, Node 24.22.1.
- `npm run build` : réussite.
- `node --check public/app.js` : réussite (syntaxe uniquement).
- `npm test` : réussite du scénario HTTP comprenant page, assets, health, agents, réponse 42 avec trace, question non textuelle/vide/trop longue, JSON invalide, corps trop volumineux et route absente.
- `node dist/index.js demo` : 3/4 avec le simulateur ; échec attendu pour la capitale de la France.
- Interface servie en HTTP : vérifiée ; rendu visuel et interactions dans un vrai navigateur non vérifiés ici.
- Docker : fichiers fournis, image non construite ici (moteur indisponible).
- Render et GitHub : configuration et instructions fournies, aucun dépôt distant créé et aucun déploiement effectué.
- API LLM réelle : non testée, aucune clé fournie.

L’application reste un prototype, sans authentification ni quota par utilisateur.
