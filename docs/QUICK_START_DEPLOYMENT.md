# Guide de Déploiement Rapide

Ce guide vous permet de déployer rapidement l'application en production en 5 étapes.

## 🚀 Déploiement en 5 Étapes

### 1. Vérifier l'état du projet (2 min)

```bash
cd /home/ubuntu/les-batisseurs-engages-app-v3

# Exécuter le health check
pnpm health-check

# Résultat attendu:
# ✅ 7 vérifications réussies
# ⚠️ 0-2 avertissements
# ❌ 0 erreurs
```

### 2. Configurer les secrets GitHub (5 min)

```bash
# Ajouter les secrets GitHub
gh secret set DATABASE_URL --body "mysql://user:pass@host:3306/db"
gh secret set JWT_SECRET --body "your-secret-key"
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/..."
gh secret set EMAIL_RECIPIENTS --body "admin@example.com"

# Vérifier les secrets
gh secret list
```

### 3. Configurer les webhooks (3 min)

```bash
# Définir les variables d'environnement
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export EMAIL_RECIPIENTS="admin@example.com"
export GITHUB_TOKEN="ghp_..."

# Configurer les webhooks
pnpm setup-webhooks

# Résultat attendu:
# ✅ Webhook Slack configuré
# ✅ Webhook Email configuré
# ✅ Webhook GitHub configuré
```

### 4. Tester le déploiement (5 min)

```bash
# Exécuter le script de déploiement
pnpm deploy

# Résultat attendu:
# ✅ Vérifications réussies
# ✅ Tests réussis
# ✅ Build réussi
# ✅ Monitoring activé
```

### 5. Valider en production (2 min)

```bash
# Vérifier que le serveur fonctionne
curl https://3000-xxx.manus.computer/

# Vérifier les logs
tail -f .manus-logs/devserver.log

# Vérifier le monitoring
pnpm monitor
```

## 📊 Vérifications Rapides

### Health Check
```bash
pnpm health-check
```
Vérifie : dépendances, TypeScript, imports, base de données, migrations, tests.

### Pre-commit Hook
```bash
# Le hook s'exécute automatiquement avant chaque commit
git commit -m "My changes"

# Ou l'exécuter manuellement
pnpm pre-commit
```

### Monitoring Continu
```bash
# Démarrer le monitoring en temps réel
pnpm monitor:continuous

# Arrêter avec Ctrl+C
```

## 🔔 Configuration des Alertes

### Slack
1. Créer un webhook Slack : https://api.slack.com/apps
2. Copier l'URL du webhook
3. Définir : `export SLACK_WEBHOOK_URL="..."`
4. Exécuter : `pnpm setup-webhooks`

### Email
1. Configurer le serveur SMTP
2. Définir : `export EMAIL_RECIPIENTS="admin@example.com"`
3. Exécuter : `pnpm setup-webhooks`

### GitHub
1. Créer un token : https://github.com/settings/tokens
2. Définir : `export GITHUB_TOKEN="ghp_..."`
3. Exécuter : `pnpm setup-webhooks`

## 📝 Scripts Disponibles

| Script | Commande | Description |
|--------|----------|-------------|
| Health Check | `pnpm health-check` | Vérifier l'état du projet |
| Monitor | `pnpm monitor` | Monitoring une fois |
| Monitor Continu | `pnpm monitor:continuous` | Monitoring en temps réel |
| Setup Webhooks | `pnpm setup-webhooks` | Configurer les webhooks |
| Deploy | `pnpm deploy` | Déployer en production |
| Pre-commit | `pnpm pre-commit` | Vérifications pré-commit |

## 🆘 Dépannage Rapide

### Le health check échoue
```bash
# Vérifier les dépendances
pnpm install

# Vérifier TypeScript
pnpm check

# Vérifier les migrations
pnpm drizzle-kit generate
```

### Le déploiement échoue
```bash
# Vérifier les logs
tail -f .manus-logs/devserver.log

# Vérifier l'état du serveur
pnpm check

# Redémarrer le serveur
# (Via l'interface Manus Management)
```

### Les webhooks ne fonctionnent pas
```bash
# Vérifier la configuration
cat .webhooks.json

# Vérifier les variables d'environnement
echo $SLACK_WEBHOOK_URL
echo $EMAIL_RECIPIENTS

# Reconfigurer les webhooks
pnpm setup-webhooks
```

## ✅ Checklist de Déploiement

- [ ] Exécuter `pnpm health-check` (résultat: ✅)
- [ ] Configurer les secrets GitHub
- [ ] Configurer les webhooks
- [ ] Exécuter `pnpm deploy` (résultat: ✅)
- [ ] Vérifier que le serveur fonctionne
- [ ] Vérifier les logs
- [ ] Tester les alertes Slack/Email
- [ ] Documenter les changements
- [ ] Notifier l'équipe

## 📚 Documentation Complète

Pour plus de détails, consultez :
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Guide complet
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Variables d'environnement
- [ERROR_PATTERNS.md](./ERROR_PATTERNS.md) - Patterns d'erreurs courants
- [MONITORING_SETUP.md](./MONITORING_SETUP.md) - Configuration du monitoring

## 🎯 Résumé

**Temps total de déploiement : ~15 minutes**

1. Health check : 2 min
2. Secrets GitHub : 5 min
3. Webhooks : 3 min
4. Déploiement : 5 min
5. Validation : 2 min

**Résultat final :**
- ✅ Application déployée en production
- ✅ Monitoring activé
- ✅ Alertes configurées
- ✅ Pre-commit hooks actifs
- ✅ CI/CD prêt
