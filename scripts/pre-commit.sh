#!/bin/bash

# Pre-commit Hook Script
# Exécute les vérifications avant chaque commit

set -e

echo "🔍 Exécution des vérifications pré-commit..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Compteurs
ERRORS=0
WARNINGS=0

# 1. Vérifier TypeScript
echo "📝 Vérification TypeScript..."
if pnpm tsc --noEmit > /dev/null 2>&1; then
  echo -e "${GREEN}✅ TypeScript OK${NC}"
else
  echo -e "${RED}❌ Erreurs TypeScript détectées${NC}"
  pnpm tsc --noEmit
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Vérifier les doublons d'imports
echo "📦 Vérification des imports dupliqués..."
DUPLICATES=$(grep -c "^import" server/db.ts | sort | uniq -d || true)
if [ -z "$DUPLICATES" ]; then
  echo -e "${GREEN}✅ Pas d'imports dupliqués${NC}"
else
  echo -e "${YELLOW}⚠️ Imports dupliqués détectés${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 3. Vérifier les fichiers de migration
echo "🗄️ Vérification des migrations..."
MIGRATION_COUNT=$(ls drizzle/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✅ $MIGRATION_COUNT migrations trouvées${NC}"
else
  echo -e "${YELLOW}⚠️ Aucune migration trouvée${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 4. Vérifier le formatage du code
echo "🎨 Vérification du formatage..."
if pnpm prettier --check . > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Formatage OK${NC}"
else
  echo -e "${YELLOW}⚠️ Code non formaté. Exécution de prettier...${NC}"
  pnpm prettier --write .
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 5. Vérifier les tests
echo "🧪 Exécution des tests..."
if pnpm test > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Tests réussis${NC}"
else
  echo -e "${YELLOW}⚠️ Certains tests ont échoué${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Vérifier les dépendances
echo "📚 Vérification des dépendances..."
if pnpm install --frozen-lockfile > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Dépendances OK${NC}"
else
  echo -e "${YELLOW}⚠️ Dépendances manquantes${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé des vérifications pré-commit:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Toutes les vérifications sont passées!${NC}"
  echo "Vous pouvez procéder au commit."
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️ $WARNINGS avertissements détectés${NC}"
  echo "Veuillez vérifier les avertissements ci-dessus."
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreurs détectées${NC}"
  echo "Veuillez corriger les erreurs avant de commiter."
  exit 1
fi
