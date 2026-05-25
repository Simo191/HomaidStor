# Guide de test de l'API Homaid Store

## 🚀 Démarrer l'API

Depuis `backend/` :

```powershell
dotnet run --project src/Homaid.API --urls http://localhost:5080
```

L'API démarre sur **http://localhost:5080** et :
- Applique les migrations EF Core (`storeproduct`)
- Seed l'admin par défaut + les zones de livraison + les catégories démo

> Pour utiliser HTTPS, retire `--urls` : l'API démarrera sur les ports
> configurés dans `launchSettings.json` (HTTPS auto-cert dev).

---

## 🧪 Méthodes de test

### Méthode 1 — Scalar UI (la plus simple, dans le navigateur)

Ouvre dans ton navigateur :

```
http://localhost:5080/scalar/v1
```

Tu vois toute la documentation interactive de l'API. Pour chaque endpoint :
1. Clique dessus
2. Remplis les paramètres / body
3. Clique **"Send"**
4. Tu vois la réponse en direct

**Pour utiliser les endpoints protégés** (logout, etc.) :
1. Login d'abord via `/api/auth/admin/login` ou `/api/auth/login`
2. Copie le `accessToken` de la réponse
3. En haut à droite de Scalar, ajoute un header `Authorization` = `Bearer <token>`

### Méthode 2 — Script PowerShell (test automatisé complet)

Dans un nouveau terminal PowerShell, l'API étant lancée :

```powershell
cd backend
.\test-api.ps1
```

Le script déroule 10 tests :
1. Health check
2. Login admin
3. Inscription client
4. Login client
5. Refresh token (rotation)
6. Vérif : ancien refresh révoqué
7. Email déjà utilisé → 409
8. Mauvais mot de passe → 401
9. Mot de passe trop court → 400
10. Headers de sécurité

Chaque test affiche `OK` ou `PROBLEME`.

### Méthode 3 — Fichier .http dans VS Code

Installe l'extension **REST Client** (humao.rest-client) dans VS Code.

Ouvre `backend/Homaid.API.http`. Au-dessus de chaque requête, un lien
`Send Request` apparaît — clique dessus, la réponse s'ouvre dans un panneau.

Les variables `{{adminAccessToken}}` etc. sont automatiquement remplies
à partir des réponses précédentes (chaînage des requêtes).

### Méthode 4 — curl en ligne de commande

```powershell
# Health
curl http://localhost:5080/api/health

# Login admin
curl -X POST http://localhost:5080/api/auth/admin/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@homaid.local\",\"password\":\"ChangeMe!2026\"}'
```

---

## 🔐 Comptes par défaut

| Compte | Email | Mot de passe | Rôle |
|---|---|---|---|
| Admin seedé | `admin@homaid.local` | `ChangeMe!2026` | `SuperAdmin` |

> Configurés via `Store:AdminEmail` et `Store:AdminDefaultPassword` dans
> `appsettings.Development.json`. **Change-les avant la mise en prod.**

---

## 📊 Vérifier le contenu de la base

Avec `psql` ou pgAdmin sur la base **`storeproduct`** :

```sql
-- Voir l'admin seed
SELECT "Email", "Role", "IsActive", "CreatedAt" FROM admins;

-- Voir les catégories et leurs traductions
SELECT c."Slug", ct."LanguageCode", ct."Name"
FROM categories c
JOIN category_translations ct ON ct."CategoryId" = c."Id"
ORDER BY c."SortOrder", ct."LanguageCode";

-- Voir les zones et méthodes de livraison
SELECT z."Name" as zone, z."CountryCodes", m."Name" as methode, m."BaseFee"
FROM shipping_zones z
JOIN shipping_methods m ON m."ZoneId" = z."Id"
ORDER BY z."SortOrder", m."SortOrder";

-- Voir les clients inscrits
SELECT "Email", "FirstName", "LastName", "Phone", "AuthProvider", "CreatedAt"
FROM customers ORDER BY "CreatedAt" DESC;

-- Voir l'historique des refresh tokens (rotation visible via RevokedAt)
SELECT "CustomerId", "AdminId", "CreatedAt", "ExpiresAt", "RevokedAt", "RevokedReason"
FROM refresh_tokens ORDER BY "CreatedAt" DESC LIMIT 20;
```

---

## 🐛 Résolution de problèmes

### "Connection refused"
L'API n'est pas démarrée — lance `dotnet run --project src/Homaid.API`.

### "relation does not exist"
La migration n'a pas été appliquée. Voir [docs/sql/README.md](sql/README.md).

### "Jwt:SigningKey must be at least 32 chars"
La clé JWT dans `appsettings.Development.json` est trop courte ou manquante.

### "Login failed for user 'postgres'"
Vérifie le `Username/Password` dans la chaîne de connexion de
`appsettings.Development.json`.

### Rate limit 429
Le rate limiter autorise 10 requêtes / minute sur `/api/auth/*`. Attends
60 secondes ou redémarre l'API.

---

## 📚 Endpoints actuellement disponibles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Santé API + connectivité BDD |
| POST | `/api/auth/register` | — | Inscription client (local) |
| POST | `/api/auth/login` | — | Login client |
| POST | `/api/auth/admin/login` | — | Login admin |
| POST | `/api/auth/refresh` | — | Rotation refresh token |
| POST | `/api/auth/logout` | Bearer | Révocation refresh token |
| GET | `/scalar/v1` | — | Documentation Scalar (dev only) |

> Les endpoints catalogue, commandes, etc. arrivent dans les prochaines étapes
> de la Phase 2.
