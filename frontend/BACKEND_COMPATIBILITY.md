# Compatibilité frontend / backend GymSaaS

Cette version du frontend a été adaptée au backend Django présent dans le projet fourni. Aucun fichier backend n'a été modifié.

## Authentification

- Connexion : `POST /api/auth/login/`
- Inscription : `POST /api/auth/register/`
- Session : `GET /api/auth/me/`
- Déconnexion : `POST /api/auth/logout/`
- Changement de mot de passe : `POST /api/auth/change-password/`
- En-tête conservé : `Authorization: Token <token>`
- Rôles supportés : `SUPER_ADMIN`, `COORDINATOR`, `MEMBER`

Les routes publiques utilisent `skipAuth` pour qu'un ancien token local ne bloque pas une nouvelle connexion ou inscription.

## Endpoints utilisés dans l'espace de gestion

- `/api/dashboard/`
- `/api/members/` et `/api/members/admin-create/`
- `/api/plans/`
- `/api/subscriptions/`
- `/api/payments/`
- `/api/attendances/`
- `/api/attendances/summary/`
- `/api/attendances/qr-checkin/`
- `/api/attendances/{id}/checkout/`
- `/api/reports/financial/`
- `/api/reports/exports/members.csv`
- `/api/reports/exports/payments.csv`
- `/api/reports/exports/attendances.csv`
- `/api/audit-logs/`

## Endpoints utilisés dans l'espace adhérent

- `/api/me/`
- `/api/me/profile/`
- `/api/me/subscription/`
- `/api/me/payments/`
- `/api/me/attendances/`
- `/api/me/qr-code/`

## Site public

- Contact : `POST /api/contacts/` est public et utilisé sans token.
- Formules : le backend actuel exige encore une authentification pour `GET /api/plans/`. Le frontend évite donc cette requête lorsqu'aucun token n'est présent afin de ne pas produire de 401 dans la console.

### Modification backend recommandée pour les formules publiques

Si les offres doivent être visibles avant connexion, autoriser uniquement les requêtes `GET`/`HEAD`/`OPTIONS` anonymes sur les formules actives. Les opérations `POST`, `PATCH` et `DELETE` doivent rester réservées à `SUPER_ADMIN` et `COORDINATOR`.

## Endpoints qui n'existent pas encore dans le backend fourni

- API publique/gestion de la salle (`Gym`) : une route du type `GET /api/gym/` et une mise à jour réservée aux responsables seraient nécessaires pour afficher nom, adresse, horaires, téléphone, équipements, etc.
- Consultation/traitement des messages de contact par les responsables : le backend fourni expose la création publique mais pas une API de gestion des messages.

Le frontend n'invente pas ces données tant que les endpoints correspondants n'existent pas.
