# Homaid Store

Boutique en ligne moderne, responsive et sécurisée — paiement cash à la livraison ou sur place.

## Stack technique

- **Backend** : ASP.NET Core Web API (.NET 9), Entity Framework Core, PostgreSQL 18
- **Frontend** : Angular 21 + Bootstrap 5 + ng-bootstrap
- **Auth** : JWT (access + refresh) + OAuth Google/Facebook
- **i18n** : Français, Arabe (RTL), Anglais

## Arborescence

```
HomaidStore/
├── backend/
│   ├── Homaid.sln
│   ├── src/
│   │   ├── Homaid.API/            # Web API (controllers, middleware)
│   │   ├── Homaid.Application/    # Services, DTOs, validation
│   │   ├── Homaid.Domain/         # Entités métier
│   │   └── Homaid.Infrastructure/ # EF Core, repositories, services externes
│   └── tests/
│       └── Homaid.Tests/          # xUnit
├── frontend/
│   └── homaid-web/                # Application Angular
└── docs/                          # Documentation du projet
```

## Démarrage rapide (développement)

### Prérequis
- .NET 9 SDK
- Node.js 22+ / npm 10+
- PostgreSQL 18

### Backend
```bash
cd backend
dotnet restore
dotnet ef database update --project src/Homaid.Infrastructure --startup-project src/Homaid.API
dotnet run --project src/Homaid.API
```
API disponible sur `https://localhost:7000` (Swagger sur `/swagger`).

### Frontend
```bash
cd frontend/homaid-web
npm install
npm start
```
App disponible sur `http://localhost:4200`.

## Sécurité

- HTTPS obligatoire en production
- JWT avec rotation des refresh tokens
- BCrypt pour le hashage des mots de passe
- Rate limiting actif sur les endpoints sensibles
- Validation côté serveur (FluentValidation)
- Conformité **RGPD** et **loi marocaine 09-08**

## Licence

Propriété du client — code livré sous accord de cession.
