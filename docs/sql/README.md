# Base de données — Guide d'application des migrations

La base cible est **`storeproduct`** sur PostgreSQL local.

## Option 1 — Via EF Core (recommandé en dev)

Depuis `backend/` :

```bash
dotnet ef database update --project src/Homaid.Infrastructure --startup-project src/Homaid.API
```

Cette commande lit `appsettings.Development.json` puis applique toutes les migrations en attente.

## Option 2 — Via le script SQL idempotent

Le fichier [`001_initial_schema.sql`](001_initial_schema.sql) est généré par
`dotnet ef migrations script --idempotent` — il peut être ré-exécuté sans risque.

Avec `psql` :

```bash
psql -h localhost -U postgres -d storeproduct -f docs/sql/001_initial_schema.sql
```

Ou via pgAdmin / DBeaver : ouvre la base `storeproduct`, charge le fichier SQL,
et exécute.

## Vérifier

```sql
\dt        -- liste les tables (18 attendues)
SELECT COUNT(*) FROM "__EFMigrationsHistory";  -- doit valoir 1
```

Tables créées :
`admins`, `addresses`, `brands`, `categories`, `category_translations`,
`customers`, `notifications`, `orders`, `order_items`, `order_status_history`,
`products`, `product_images`, `product_translations`, `push_subscriptions`,
`refresh_tokens`, `shipping_methods`, `shipping_zones`, `stock_movements`.

## Seed initial

Au premier démarrage de l'API en environnement **Development**, le seed
crée automatiquement :
- 1 admin super-administrateur (`Store:AdminEmail`, mot de passe par défaut
  `ChangeMe!2026` — **À CHANGER IMMÉDIATEMENT**)
- 2 zones de livraison (Maroc + International) avec méthodes par défaut
- 5 catégories de démo (Électronique, Vêtements, Maison, Alimentation, Beauté)
  traduites en FR/AR/EN.

Pour personnaliser, défini ces clés dans `appsettings.Development.json` avant
le premier `dotnet run` :

```json
{
  "Store": {
    "AdminEmail": "admin@homaid.local",
    "AdminDefaultPassword": "ChoisisUnMotDePasseFort!"
  }
}
```

## Régénérer une migration

En cas de modification d'entités :

```bash
dotnet ef migrations add NomDeLaModification --project src/Homaid.Infrastructure --startup-project src/Homaid.API --output-dir Persistence/Migrations
dotnet ef migrations script --project src/Homaid.Infrastructure --startup-project src/Homaid.API --output docs/sql/00X_nom.sql --idempotent
```
