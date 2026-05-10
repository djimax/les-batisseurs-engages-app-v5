# Guide de Déploiement en Production

Ce guide explique comment déployer les scripts de monitoring et les pre-commit hooks en production.

## 📋 Prérequis

- Node.js 22+
- pnpm 8+
- Git
- Accès au repository
- Variables d'environnement configurées

## 🚀 Déploiement

### 1. Préparation

```bash
# Cloner le repository
git clone <repository-url>
cd les-batisseurs-engages-app-v3

# Installer les dépendances
pnpm install

# Vérifier l'état du repository
git status
```

### 2. Exécuter le script de déploiement

```bash
# Rendre le script exécutable
chmod +x scripts/deploy.sh

# Exécuter le déploiement
bash scripts/deploy.sh
```

**Le script effectue :**

- ✅ Vérification des prérequis
- ✅ Vérification de l'état du repository
- ✅ Exécution des tests
- ✅ Vérification TypeScript
- ✅ Health check
- ✅ Copie des scripts
- ✅ Configuration du monitoring
- ✅ Création des logs

### 3. Configurer les webhooks

```bash
# Configurer les webhooks (Slack, Email, GitHub)
npx tsx scripts/setup-webhooks.ts
```

**Variables d'environnement requises :**

```bash
# Slack
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Email
export EMAIL_RECIPIENTS="admin@example.com"

# GitHub
export GITHUB_TOKEN="ghp_..."

# Webhooks personnalisés
export CUSTOM_WEBHOOKS='[{"name":"Custom","url":"...","events":["error"]}]'
```

### 4. Configurer les GitHub Actions

```bash
# Créer les secrets GitHub
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."
gh secret set EMAIL_RECIPIENTS --body "admin@example.com"
gh secret set GITHUB_TOKEN --body "ghp_..."

# Vérifier les secrets
gh secret list
```

### 5. Configurer le pre-commit hook

```bash
# Copier le hook
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Tester le hook
bash .git/hooks/pre-commit
```

## 📊 Vérifications de Production

### Health Check

```bash
# Vérification rapide
npx tsx scripts/health-check.ts

# Sortie attendue
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

### Monitoring Continu

```bash
# Démarrer le monitoring continu
npx tsx scripts/monitor.ts --continuous

# Arrêter avec Ctrl+C
```

### Tests Complets

```bash
# Exécuter tous les tests
pnpm test

# Exécuter avec couverture
pnpm test --coverage
```

## 🔔 Configuration des Alertes

### Slack

1. Créer un webhook Slack :
   - Aller à https://api.slack.com/apps
   - Créer une nouvelle application
   - Activer "Incoming Webhooks"
   - Créer un nouveau webhook
   - Copier l'URL

2. Configurer le webhook :
   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
   npx tsx scripts/setup-webhooks.ts
   ```

### Email

1. Configurer les destinataires :

   ```bash
   export EMAIL_RECIPIENTS="admin@example.com,dev@example.com"
   npx tsx scripts/setup-webhooks.ts
   ```

2. Configurer le serveur SMTP :
   ```bash
   export SMTP_HOST="smtp.example.com"
   export SMTP_PORT="587"
   export SMTP_USER="user@example.com"
   export SMTP_PASSWORD="password"
   ```

### GitHub

1. Créer un token GitHub :
   - Aller à https://github.com/settings/tokens
   - Créer un nouveau token
   - Sélectionner les scopes : `repo`, `workflow`
   - Copier le token

2. Configurer le token :
   ```bash
   export GITHUB_TOKEN="ghp_..."
   npx tsx scripts/setup-webhooks.ts
   ```

## 📝 Logs de Production

### Localisation des logs

```bash
# Logs du serveur
tail -f .manus-logs/devserver.log

# Logs du navigateur
tail -f .manus-logs/browserConsole.log

# Logs des requêtes réseau
tail -f .manus-logs/networkRequests.log

# Logs du monitoring
tail -f .manus-logs/monitoring.log
```

### Rotation des logs

Les logs sont automatiquement rotatés quand ils dépassent 1MB.

```bash
# Configuration dans monitoring.config.json
"logging": {
  "level": "info",
  "file": ".manus-logs/monitoring.log",
  "max_size": "10MB",
  "max_files": 10
}
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Variables d'environnement** :
   - Ne jamais commiter `.env` ou les secrets
   - Utiliser `.env.example` pour la documentation
   - Utiliser les secrets GitHub Actions

2. **Permissions** :
   - Limiter l'accès aux scripts de déploiement
   - Utiliser les rôles GitHub pour les approvals
   - Auditer les changements en production

3. **Monitoring** :
   - Surveiller les erreurs critiques
   - Alerter sur les changements non autorisés
   - Maintenir les logs pour l'audit

## 🚨 Dépannage

### Le déploiement échoue

```bash
# Vérifier les prérequis
pnpm --version
node --version
git --version

# Vérifier les permissions
ls -la scripts/deploy.sh

# Vérifier l'état du repository
git status
git log --oneline -5
```

### Les webhooks ne fonctionnent pas

```bash
# Vérifier la configuration
cat .webhooks.json

# Vérifier les variables d'environnement
echo $SLACK_WEBHOOK_URL
echo $EMAIL_RECIPIENTS
echo $GITHUB_TOKEN

# Tester les webhooks
npx tsx scripts/setup-webhooks.ts
```

### Les tests échouent

```bash
# Exécuter les tests avec détails
pnpm test --reporter=verbose

# Exécuter un test spécifique
pnpm test server/members.test.ts

# Voir les erreurs détaillées
pnpm test --no-coverage
```

## 📚 Ressources

- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Configuration du monitoring
- [ERROR_PATTERNS.md](./ERROR_PATTERNS.md) - Patterns d'erreurs courants
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)

## ✅ Checklist de Déploiement

- [ ] Vérifier les prérequis
- [ ] Exécuter le script de déploiement
- [ ] Configurer les webhooks
- [ ] Configurer les GitHub Actions
- [ ] Configurer le pre-commit hook
- [ ] Tester le health check
- [ ] Tester le monitoring
- [ ] Vérifier les logs
- [ ] Tester les alertes
- [ ] Documenter les changements
- [ ] Notifier l'équipe

## 🎯 Objectifs du Déploiement

- ✅ Automatiser les vérifications
- ✅ Détecter les erreurs rapidement
- ✅ Prévenir les régressions
- ✅ Maintenir la qualité du code
- ✅ Faciliter la collaboration
- ✅ Documenter les problèmes
