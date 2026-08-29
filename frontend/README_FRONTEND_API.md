# Frontend GymSaaS - intégration API

Le frontend utilise le proxy Vite `/api` en développement et respecte le contrat Django existant.

- Authentification : `Authorization: Token <token>`
- Rôles : `SUPER_ADMIN`, `COORDINATOR`, `MEMBER`
- Connexion et inscription : requêtes publiques avec `skipAuth`
- Session validée au démarrage via `/api/auth/me/`
- Les erreurs `401` sur les routes protégées nettoient la session locale.

Pour la liste complète des endpoints utilisés et des endpoints backend encore nécessaires, voir [`BACKEND_COMPATIBILITY.md`](./BACKEND_COMPATIBILITY.md).
