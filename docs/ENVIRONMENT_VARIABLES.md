# Configuration des Variables d'Environnement

Ce guide explique toutes les variables d'environnement requises pour le déploiement en production.

## 📋 Variables Requises

### Application Configuration

| Variable      | Description              | Exemple                  |
| ------------- | ------------------------ | ------------------------ |
| `NODE_ENV`    | Environnement Node       | `production`             |
| `APP_NAME`    | Nom de l'application     | `Les Bâtisseurs Engagés` |
| `APP_VERSION` | Version de l'application | `1.0.0`                  |

### Database Configuration

| Variable       | Description                    | Exemple                          |
| -------------- | ------------------------------ | -------------------------------- |
| `DATABASE_URL` | Chaîne de connexion MySQL/TiDB | `mysql://user:pass@host:3306/db` |

### Authentication

| Variable                | Description                     | Exemple                  |
| ----------------------- | ------------------------------- | ------------------------ |
| `JWT_SECRET`            | Secret pour signer les sessions | `your-secret-key`        |
| `VITE_APP_ID`           | ID de l'application Manus OAuth | `app-id`                 |
| `OAUTH_SERVER_URL`      | URL du serveur OAuth            | `https://api.manus.im`   |
| `VITE_OAUTH_PORTAL_URL` | URL du portail OAuth            | `https://manus.im/login` |
| `OWNER_NAME`            | Nom du propriétaire             | `Your Name`              |
| `OWNER_OPEN_ID`         | ID OpenID du propriétaire       | `open-id`                |

### API Configuration

| Variable                      | Description        | Exemple                |
| ----------------------------- | ------------------ | ---------------------- |
| `BUILT_IN_FORGE_API_URL`      | URL de l'API Manus | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY`      | Clé API serveur    | `api-key`              |
| `VITE_FRONTEND_FORGE_API_URL` | URL API frontend   | `https://api.manus.im` |
| `VITE_FRONTEND_FORGE_API_KEY` | Clé API frontend   | `frontend-api-key`     |

### Monitoring & Logging

| Variable           | Description         | Exemple       |
| ------------------ | ------------------- | ------------- |
| `MONITORING_LEVEL` | Niveau de log       | `info`        |
| `LOG_DIR`          | Répertoire des logs | `.manus-logs` |

### Webhooks & Notifications

| Variable            | Description         | Exemple                       |
| ------------------- | ------------------- | ----------------------------- |
| `SLACK_WEBHOOK_URL` | Webhook Slack       | `https://hooks.slack.com/...` |
| `EMAIL_RECIPIENTS`  | Destinataires email | `admin@example.com`           |
| `SMTP_HOST`         | Serveur SMTP        | `smtp.example.com`            |
| `SMTP_PORT`         | Port SMTP           | `587`                         |
| `SMTP_USER`         | Utilisateur SMTP    | `user@example.com`            |
| `SMTP_PASSWORD`     | Mot de passe SMTP   | `password`                    |
| `GITHUB_TOKEN`      | Token GitHub        | `ghp_...`                     |

### Deployment Configuration

| Variable     | Description                  | Exemple           |
| ------------ | ---------------------------- | ----------------- |
| `DEPLOY_ENV` | Environnement de déploiement | `production`      |
| `DEPLOY_DIR` | Répertoire de déploiement    | `.`               |
| `PROD_ENV`   | Fichier d'environnement prod | `.env.production` |

### Analytics & Monitoring

| Variable                    | Description          | Exemple                      |
| --------------------------- | -------------------- | ---------------------------- |
| `VITE_ANALYTICS_ENDPOINT`   | Endpoint d'analytics | `https://analytics.manus.im` |
| `VITE_ANALYTICS_WEBSITE_ID` | ID du site analytics | `website-id`                 |

### Feature Flags

| Variable               | Description             | Valeur           |
| ---------------------- | ----------------------- | ---------------- |
| `FEATURE_MONITORING`   | Activer le monitoring   | `true` / `false` |
| `FEATURE_ALERTS`       | Activer les alertes     | `true` / `false` |
| `FEATURE_AUTO_RESTART` | Redémarrage automatique | `true` / `false` |

### Performance Configuration

| Variable                  | Description         | Valeur  |
| ------------------------- | ------------------- | ------- |
| `SLOW_QUERY_THRESHOLD_MS` | Seuil requête lente | `1000`  |
| `SLOW_BUILD_THRESHOLD_MS` | Seuil build lent    | `30000` |

### Security Configuration

| Variable                  | Description              | Exemple                  |
| ------------------------- | ------------------------ | ------------------------ |
| `CORS_ORIGIN`             | Origine CORS autorisée   | `https://yourdomain.com` |
| `RATE_LIMIT_WINDOW_MS`    | Fenêtre rate limit       | `900000`                 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requêtes par fenêtre | `100`                    |

## 🔧 Configuration

### Créer le fichier .env.production

```bash
# Copier le template
cp .env.example .env.production

# Éditer avec vos valeurs
nano .env.production
```

### Charger les variables

```bash
# Charger les variables dans le shell
export $(cat .env.production | xargs)

# Ou utiliser direnv
echo "export \$(cat .env.production | xargs)" > .envrc
direnv allow
```

### Vérifier les variables

```bash
# Afficher une variable
echo $DATABASE_URL

# Afficher toutes les variables
env | grep -E "^(DATABASE|JWT|OAUTH|SLACK|EMAIL)" | sort
```

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les secrets** :

   ```bash
   # Ajouter .env.production au .gitignore
   echo ".env.production" >> .gitignore
   ```

2. **Utiliser les secrets GitHub Actions** :

   ```bash
   gh secret set DATABASE_URL --body "mysql://..."
   gh secret set JWT_SECRET --body "secret"
   ```

3. **Limiter l'accès** :
   - Restreindre l'accès aux fichiers .env
   - Utiliser des permissions appropriées
   - Auditer l'accès aux secrets

4. **Rotation des secrets** :
   - Changer les clés API régulièrement
   - Utiliser des tokens avec expiration
   - Monitorer l'utilisation des secrets

## 📝 Exemples

### Configuration de développement

```bash
NODE_ENV=development
DATABASE_URL=mysql://root:password@localhost:3306/test
JWT_SECRET=dev-secret-key
VITE_APP_ID=dev-app-id
MONITORING_LEVEL=debug
```

### Configuration de production

```bash
NODE_ENV=production
DATABASE_URL=mysql://prod_user:secure_password@prod-host:3306/prod_db
JWT_SECRET=production-secret-key-very-secure
VITE_APP_ID=prod-app-id
MONITORING_LEVEL=info
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Configuration de staging

```bash
NODE_ENV=staging
DATABASE_URL=mysql://staging_user:staging_password@staging-host:3306/staging_db
JWT_SECRET=staging-secret-key
VITE_APP_ID=staging-app-id
MONITORING_LEVEL=info
```

## 🚀 Déploiement

### Avant le déploiement

1. Vérifier toutes les variables :

   ```bash
   npx tsx scripts/health-check.ts
   ```

2. Tester la connexion à la base de données :

   ```bash
   pnpm drizzle-kit introspect
   ```

3. Exécuter les tests :
   ```bash
   pnpm test
   ```

### Pendant le déploiement

1. Charger les variables :

   ```bash
   export $(cat .env.production | xargs)
   ```

2. Exécuter le script de déploiement :

   ```bash
   bash scripts/deploy.sh
   ```

3. Vérifier le déploiement :
   ```bash
   npx tsx scripts/monitor.ts
   ```

## 🆘 Dépannage

### Variable non trouvée

```bash
# Vérifier si la variable existe
echo $VARIABLE_NAME

# Vérifier le fichier .env
cat .env.production | grep VARIABLE_NAME

# Charger les variables à nouveau
export $(cat .env.production | xargs)
```

### Connexion à la base de données échoue

```bash
# Vérifier la variable DATABASE_URL
echo $DATABASE_URL

# Tester la connexion
mysql -h host -u user -p database

# Vérifier les permissions
pnpm drizzle-kit introspect
```

### Erreur d'authentification OAuth

```bash
# Vérifier les variables OAuth
echo $VITE_APP_ID
echo $OAUTH_SERVER_URL
echo $VITE_OAUTH_PORTAL_URL

# Vérifier le JWT_SECRET
echo $JWT_SECRET
```

## 📚 Ressources

- [Manus Documentation](https://docs.manus.im)
- [OAuth 2.0 Guide](https://oauth.net/2/)
- [Environment Variables Best Practices](https://12factor.net/config)
