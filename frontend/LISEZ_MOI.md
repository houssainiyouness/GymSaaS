# GymSaaS - frontend responsive

## Installation Windows

Depuis `frontend` :

```powershell
npm.cmd install
npm.cmd run test
npm.cmd run lint
npm.cmd run build
npm.cmd run dev
```

Django doit être lancé séparément sur `http://127.0.0.1:8000`.

En développement, Vite utilise le proxy `/api` défini dans `vite.config.js`. Il n'est donc pas nécessaire de créer un `.env` local pour l'API.

## Points importants

- Ne remplacez jamais `Token` par `Bearer`.
- Ne versionnez pas `.env`, `node_modules` ou `dist`.
- Le frontend reconnaît uniquement `SUPER_ADMIN`, `COORDINATOR` et `MEMBER`.
- Le site public n'appelle pas `/api/plans/` sans authentification, car le backend fourni retourne actuellement `401` dans ce cas.
- Le QR adhérent utilise la valeur réelle de `/api/me/qr-code/` et la rend sous forme de QR scannable.
- Le design est responsive : navigation publique mobile, sidebar de gestion en tiroir et espace adhérent adapté aux petits écrans.

Voir `BACKEND_COMPATIBILITY.md` pour les endpoints réellement disponibles et ceux qui manquent encore.
