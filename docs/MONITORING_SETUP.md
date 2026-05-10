# Guide de Configuration du Monitoring

Ce guide explique comment configurer et utiliser le système de surveillance du projet.

## 📋 Vue d'ensemble

Le système de monitoring comprend :

- **Health Check** : Vérification rapide de l'état du projet
- **Pre-commit Hook** : Vérifications avant chaque commit
- **Continuous Monitor** : Surveillance en temps réel
- **Error Patterns** : Documentation des erreurs courantes

## 🚀 Installation

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Rendre les scripts exécutables

```bash
chmod +x scripts/health-check.ts
chmod +x scripts/monitor.ts
chmod +x scripts/pre-commit.sh
```

### 3. Configurer le pre-commit hook (optionnel)

```bash
# Créer le hook Git
mkdir -p .git/hooks
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 📊 Utilisation

### Health Check - Vérification rapide

```bash
# Exécuter une vérification de santé
pnpm health-check

# Ou avec tsx
npx tsx scripts/health-check.ts
```

**Sortie exemple :**

```
🏥 Démarrage des vérifications de santé du projet...

✅ Dependencies: 45 dépendances, 28 dev-dépendances
✅ TypeScript: Aucune erreur TypeScript
✅ Imports: Aucun import dupliqué
✅ Database Schema: Toutes les tables critiques présentes
✅ Configuration Files: Tous les fichiers de configuration présents
✅ Tests: 5 fichiers de test trouvés
✅ Migrations: 11 migrations trouvées

📊 Résumé:
✅ 7 vérifications réussies
⚠️ 0 avertissements
❌ 0 erreurs

✅ Le projet est en bonne santé!
```

### Pre-commit Hook - Vérifications avant commit

```bash
# Le hook s'exécute automatiquement avant chaque commit
git commit -m "Votre message"

# Ou exécuter manuellement
bash scripts/pre-commit.sh
```

**Vérifications effectuées :**

- TypeScript compilation
- Imports dupliqués
- Migrations
- Formatage du code (Prettier)
- Tests
- Dépendances

### Continuous Monitor - Surveillance en temps réel

```bash
# Exécuter une vérification unique
npx tsx scripts/monitor.ts

# Exécuter le monitoring continu (toutes les 5 minutes)
npx tsx scripts/monitor.ts --continuous
```

**Sortie exemple :**

```
[2026-05-09T20:40:00.000Z] 🔍 Démarrage des vérifications de monitoring...

📊 Résultats des vérifications:

✅ typescript              30ms - Vérification réussie
✅ tests                   150ms - Vérification réussie
✅ database                20ms - Vérification réussie
✅ dependencies            45ms - Vérification réussie
✅ formatting              60ms - Vérification réussie
```

## ⚙️ Configuration

### Configuration du monitoring

Modifier `monitoring.config.json` :

```json
{
  "monitoring": {
    "enabled": true,
    "interval": 300000,
    "alerts": {
      "typescript_errors": {
        "enabled": true,
        "threshold": 0,
        "action": "fail"
      }
    }
  }
}
```

**Paramètres :**

- `enabled` : Activer/désactiver le monitoring
- `interval` : Intervalle entre les vérifications (ms)
- `threshold` : Nombre d'erreurs tolérées
- `action` : Action à prendre (fail/warn)

### Ajouter une vérification personnalisée

1. Ajouter la vérification dans `monitoring.config.json` :

```json
{
  "checks": {
    "custom_check": {
      "enabled": true,
      "command": "votre-commande",
      "timeout": 30000
    }
  }
}
```

2. Implémenter la vérification dans le script approprié

## 🔔 Notifications

### Configuration des alertes email

```json
{
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": ["dev@example.com"]
    }
  }
}
```

### Configuration Slack

```json
{
  "notifications": {
    "slack": {
      "enabled": true,
      "webhook_url": "https://hooks.slack.com/services/..."
    }
  }
}
```

## 📈 Métriques

Le monitoring suit les métriques suivantes :

- **Build Time** : Temps de compilation TypeScript
- **Test Time** : Temps d'exécution des tests
- **Query Time** : Temps des requêtes base de données
- **Error Rate** : Taux d'erreurs détectées

## 🚨 Alertes

### Erreurs critiques

Les erreurs suivantes déclenchent une alerte immédiate :

- Erreurs TypeScript
- Échecs de tests
- Problèmes de base de données
- Migrations manquantes

### Avertissements

Les avertissements suivants sont enregistrés :

- Exports inutilisés
- Imports dupliqués
- Code non formaté
- Dépendances manquantes

## 📝 Logs

Les logs sont sauvegardés dans `.manus-logs/monitoring.log`

```bash
# Afficher les logs récents
tail -f .manus-logs/monitoring.log

# Filtrer les erreurs
grep "ERROR" .manus-logs/monitoring.log

# Filtrer les avertissements
grep "WARN" .manus-logs/monitoring.log
```

## 🔧 Dépannage

### Le monitoring ne démarre pas

```bash
# Vérifier les permissions
chmod +x scripts/monitor.ts

# Vérifier la configuration
cat monitoring.config.json | jq .

# Vérifier les dépendances
pnpm install
```

### Les alertes ne s'envoient pas

```bash
# Vérifier la configuration des notifications
cat monitoring.config.json | jq .monitoring.notifications

# Vérifier les logs
tail -f .manus-logs/monitoring.log
```

### Les tests échouent

```bash
# Exécuter les tests manuellement
pnpm test

# Voir les détails des erreurs
pnpm test --reporter=verbose
```

## 📚 Ressources

- [Documentation des patterns d'erreurs](./ERROR_PATTERNS.md)
- [Guide de contribution](./CONTRIBUTING.md)
- [Architecture du projet](./ARCHITECTURE.md)

## 💡 Bonnes pratiques

1. **Exécuter le health check avant chaque commit**

   ```bash
   pnpm health-check
   ```

2. **Configurer le pre-commit hook**

   ```bash
   cp scripts/pre-commit.sh .git/hooks/pre-commit
   ```

3. **Surveiller les logs régulièrement**

   ```bash
   tail -f .manus-logs/monitoring.log
   ```

4. **Mettre à jour la configuration selon les besoins**

   ```bash
   vim monitoring.config.json
   ```

5. **Documenter les nouvelles erreurs**
   - Ajouter à `docs/ERROR_PATTERNS.md`
   - Créer une vérification correspondante
   - Mettre à jour la configuration

## 🎯 Objectifs du monitoring

- ✅ Détecter les erreurs rapidement
- ✅ Prévenir les régressions
- ✅ Maintenir la qualité du code
- ✅ Faciliter la collaboration
- ✅ Documenter les problèmes courants
