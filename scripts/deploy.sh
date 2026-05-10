#!/bin/bash

# Production Deployment Script
# Déploie les scripts de monitoring et configure l'environnement de production

set -e

echo "🚀 Démarrage du déploiement en production..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROD_ENV="${PROD_ENV:-.env.production}"
DEPLOY_DIR="${DEPLOY_DIR:-.}"
LOG_DIR=".manus-logs"

# Compteurs
STEPS_COMPLETED=0
TOTAL_STEPS=10

# Fonction pour afficher la progression
progress() {
  STEPS_COMPLETED=$((STEPS_COMPLETED + 1))
  echo -e "${BLUE}[${STEPS_COMPLETED}/${TOTAL_STEPS}]${NC} $1"
}

# Fonction pour afficher les erreurs
error() {
  echo -e "${RED}❌ Erreur: $1${NC}"
  exit 1
}

# Fonction pour afficher les succès
success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# 1. Vérifier les prérequis
progress "Vérification des prérequis..."
if ! command -v pnpm &> /dev/null; then
  error "pnpm n'est pas installé"
fi
if ! command -v git &> /dev/null; then
  error "git n'est pas installé"
fi
success "Tous les prérequis sont présents"
echo ""

# 2. Vérifier l'état du repository
progress "Vérification de l'état du repository..."
if [ -z "$(git status --porcelain)" ]; then
  success "Repository propre"
else
  error "Repository contient des changements non committés"
fi
echo ""

# 3. Exécuter les tests
progress "Exécution des tests..."
if pnpm test > /dev/null 2>&1; then
  success "Tous les tests réussis"
else
  error "Certains tests ont échoué"
fi
echo ""

# 4. Vérifier TypeScript
progress "Vérification TypeScript..."
if pnpm tsc --noEmit > /dev/null 2>&1; then
  success "Aucune erreur TypeScript"
else
  error "Erreurs TypeScript détectées"
fi
echo ""

# 5. Exécuter le health check
progress "Exécution du health check..."
if npx tsx scripts/health-check.ts > /dev/null 2>&1; then
  success "Health check réussi"
else
  error "Health check échoué"
fi
echo ""

# 6. Créer les répertoires de logs
progress "Création des répertoires de logs..."
mkdir -p "$LOG_DIR"
success "Répertoires créés"
echo ""

# 7. Copier les scripts de monitoring
progress "Copie des scripts de monitoring..."
mkdir -p "$DEPLOY_DIR/scripts"
cp scripts/health-check.ts "$DEPLOY_DIR/scripts/" || error "Impossible de copier health-check.ts"
cp scripts/monitor.ts "$DEPLOY_DIR/scripts/" || error "Impossible de copier monitor.ts"
cp scripts/pre-commit.sh "$DEPLOY_DIR/scripts/" || error "Impossible de copier pre-commit.sh"
chmod +x "$DEPLOY_DIR/scripts/pre-commit.sh"
success "Scripts copiés et configurés"
echo ""

# 8. Copier la configuration de monitoring
progress "Copie de la configuration de monitoring..."
cp monitoring.config.json "$DEPLOY_DIR/" || error "Impossible de copier monitoring.config.json"
success "Configuration copiée"
echo ""

# 9. Configurer les variables d'environnement
progress "Configuration des variables d'environnement..."
if [ -f "$PROD_ENV" ]; then
  export $(cat "$PROD_ENV" | xargs)
  success "Variables d'environnement chargées"
else
  echo -e "${YELLOW}⚠️ Fichier $PROD_ENV non trouvé${NC}"
fi
echo ""

# 10. Créer un fichier de déploiement
progress "Création du fichier de déploiement..."
cat > "$DEPLOY_DIR/DEPLOYMENT.md" << 'EOF'
# Déploiement en Production

## Date de déploiement
$(date)

## Scripts déployés
- health-check.ts : Vérification rapide de l'état du projet
- monitor.ts : Surveillance en temps réel
- pre-commit.sh : Vérifications avant commit

## Configuration
- monitoring.config.json : Configuration centralisée du monitoring

## Vérifications effectuées
- ✅ Tests réussis
- ✅ TypeScript sans erreurs
- ✅ Health check réussi
- ✅ Repository propre

## Prochaines étapes
1. Configurer les GitHub Actions
2. Mettre en place les webhooks
3. Configurer les notifications
4. Tester le système complet

## Support
Pour toute question, consultez:
- docs/MONITORING_SETUP.md
- docs/ERROR_PATTERNS.md
EOF

success "Fichier de déploiement créé"
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Déploiement en production réussi!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Résumé du déploiement:"
echo "  • Scripts de monitoring : ✅ Déployés"
echo "  • Configuration : ✅ Configurée"
echo "  • Logs : ✅ Prêts"
echo "  • Tests : ✅ Réussis"
echo ""
echo "🔍 Vérifications de monitoring:"
echo "  • Health check : npx tsx scripts/health-check.ts"
echo "  • Monitor continu : npx tsx scripts/monitor.ts --continuous"
echo "  • Pre-commit hook : bash scripts/pre-commit.sh"
echo ""
echo "📝 Documentation:"
echo "  • Setup : docs/MONITORING_SETUP.md"
echo "  • Erreurs : docs/ERROR_PATTERNS.md"
echo "  • Déploiement : DEPLOYMENT.md"
echo ""
