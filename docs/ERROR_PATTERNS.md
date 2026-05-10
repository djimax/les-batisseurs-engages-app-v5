# Patterns d'Erreurs et Solutions

Ce document documente les erreurs courantes rencontrées dans le projet et leurs solutions.

## 1. Erreur : "Cannot read properties of null (reading 'useState')"

### Cause

- Versions incompatibles de React et React DOM
- Plusieurs copies de React dans l'application
- Hooks appelés en dehors d'un composant React

### Solution

```bash
# Redémarrer le serveur de développement
pnpm dev

# Nettoyer les caches
rm -rf node_modules/.vite
pnpm install
```

### Prévention

- Toujours appeler les hooks au niveau du composant
- Vérifier que React est importé correctement
- Utiliser `useCallback` pour les fonctions stables

---

## 2. Erreur : "[vite] failed to connect to websocket"

### Cause

- Configuration HMR incorrecte
- Proxy ou firewall bloquant les WebSockets
- Port Vite mal configuré

### Solution

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    hmr: {
      protocol: "wss",
      host: "your-domain.com",
      port: 443,
    },
  },
});
```

### Prévention

- Utiliser `window.location.origin` pour les URLs dynamiques
- Tester la connexion WebSocket régulièrement
- Vérifier la configuration HMR après chaque déploiement

---

## 3. Erreur : "Invalid hook call"

### Cause

- Appel de hooks conditionnellement
- Appel de hooks en dehors d'un composant
- Ordre des hooks différent entre rendus

### Solution

```typescript
// ❌ Mauvais
if (condition) {
  const [state, setState] = useState(0);
}

// ✅ Bon
const [state, setState] = useState(0);
if (condition) {
  // utiliser state
}
```

### Prévention

- Linter ESLint avec `eslint-plugin-react-hooks`
- Tester les composants avec Vitest
- Respecter les Rules of Hooks

---

## 4. Erreur : "Type 'number' is not assignable to type 'string'"

### Cause

- Changement de type de colonne sans migration
- Mismatch entre schéma TypeScript et base de données
- Imports incorrects des types

### Solution

```bash
# Générer migration
pnpm drizzle-kit generate

# Appliquer migration
pnpm drizzle-kit migrate
```

### Prévention

- Toujours générer migrations après changement de schéma
- Vérifier les types TypeScript avant le déploiement
- Utiliser `as any` temporairement si nécessaire, puis corriger

---

## 5. Erreur : "Duplicate export 'generateMemberId'"

### Cause

- Fonction exportée deux fois dans le même fichier
- Import/export dupliqué
- Mauvaise fusion de code

### Solution

```bash
# Chercher les doublons
grep -n "export.*generateMemberId" server/db.ts

# Supprimer la duplication
# Garder une seule définition
```

### Prévention

- Utiliser `grep` pour chercher les doublons avant commit
- Vérifier les merges de branches
- Utiliser un linter pour détecter les exports dupliqués

---

## 6. Erreur : "Cannot find name 'cotisationCriteria'"

### Cause

- Import manquant du schéma
- Typo dans le nom de la table
- Table non exportée du schéma

### Solution

```typescript
// Vérifier l'import
import { cotisationCriteria } from "../drizzle/schema";

// Vérifier l'export dans schema.ts
export const cotisationCriteria = mysqlTable(...);
```

### Prévention

- Utiliser l'autocomplétion IDE
- Vérifier les imports après chaque changement de schéma
- Exécuter TypeScript check avant commit

---

## 7. Erreur : "Database connection failed"

### Cause

- Variables d'environnement manquantes
- Base de données non accessible
- Migrations non appliquées

### Solution

```bash
# Vérifier les variables d'environnement
echo $DATABASE_URL

# Tester la connexion
pnpm drizzle-kit introspect

# Appliquer les migrations
pnpm drizzle-kit migrate
```

### Prévention

- Documenter toutes les variables d'environnement requises
- Créer un script de vérification de santé
- Tester la connexion au démarrage

---

## 8. Erreur : "Uncaught SyntaxError: Unexpected token"

### Cause

- Fichier mal formaté
- Caractères spéciaux non échappés
- Syntaxe TypeScript/JSX incorrecte

### Solution

```bash
# Formater le code
pnpm prettier --write .

# Vérifier la syntaxe
pnpm tsc --noEmit
```

### Prévention

- Utiliser Prettier pour le formatage automatique
- Configurer pre-commit hooks
- Vérifier TypeScript avant chaque commit

---

## 9. Erreur : "Migration already applied"

### Cause

- Tentative d'appliquer une migration déjà appliquée
- Fichier de migration corrompu
- Historique de migration incohérent

### Solution

```bash
# Vérifier l'historique des migrations
pnpm drizzle-kit introspect

# Réinitialiser si nécessaire
# ⚠️ ATTENTION : Cela supprime les données
pnpm drizzle-kit drop
```

### Prévention

- Vérifier l'historique avant d'appliquer
- Utiliser des transactions pour les migrations
- Documenter chaque migration

---

## 10. Erreur : "Cannot read property 'memberId' of undefined"

### Cause

- Objet null ou undefined
- Accès à une propriété qui n'existe pas
- Requête qui ne retourne rien

### Solution

```typescript
// Vérifier null/undefined
if (!member) {
  throw new Error("Member not found");
}

// Utiliser l'optional chaining
const id = member?.memberId;

// Fournir une valeur par défaut
const id = member?.memberId ?? "unknown";
```

### Prévention

- Toujours vérifier null/undefined
- Utiliser TypeScript strict mode
- Ajouter des tests pour les cas limites

---

## Checklist de Prévention

- [ ] Exécuter `pnpm health-check` avant chaque commit
- [ ] Vérifier TypeScript : `pnpm tsc --noEmit`
- [ ] Exécuter les tests : `pnpm test`
- [ ] Vérifier les migrations : `pnpm drizzle-kit introspect`
- [ ] Formater le code : `pnpm prettier --write .`
- [ ] Vérifier les imports dupliqués
- [ ] Vérifier les exports inutilisés
- [ ] Tester les changements de schéma
- [ ] Documenter les changements

---

## Ressources

- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Vite HMR Configuration](https://vite.dev/config/server-options.html#server-hmr)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
