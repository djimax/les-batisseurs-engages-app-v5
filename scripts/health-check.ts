#!/usr/bin/env node

/**
 * Health Check Script
 * Vérifie l'état du projet et détecte les erreurs courantes
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface HealthCheckResult {
  name: string;
  status: "✅" | "⚠️" | "❌";
  message: string;
  severity: "info" | "warning" | "error";
}

const results: HealthCheckResult[] = [];

// Couleurs pour le terminal
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
};

function log(color: string, text: string) {
  console.log(`${color}${text}${colors.reset}`);
}

function addResult(result: HealthCheckResult) {
  results.push(result);
  log(
    result.status === "✅"
      ? colors.green
      : result.status === "⚠️"
        ? colors.yellow
        : colors.red,
    `${result.status} ${result.name}: ${result.message}`
  );
}

// 1. Vérifier les dépendances
function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});

    if (deps.length === 0 && devDeps.length === 0) {
      addResult({
        name: "Dependencies",
        status: "❌",
        message: "Aucune dépendance trouvée",
        severity: "error",
      });
    } else {
      addResult({
        name: "Dependencies",
        status: "✅",
        message: `${deps.length} dépendances, ${devDeps.length} dev-dépendances`,
        severity: "info",
      });
    }
  } catch (error) {
    addResult({
      name: "Dependencies",
      status: "❌",
      message: "Erreur lors de la lecture de package.json",
      severity: "error",
    });
  }
}

// 2. Vérifier TypeScript
function checkTypeScript() {
  try {
    const output = execSync("pnpm tsc --noEmit 2>&1", { encoding: "utf-8" });
    if (output.includes("error")) {
      const errorCount = (output.match(/error TS/g) || []).length;
      addResult({
        name: "TypeScript",
        status: "❌",
        message: `${errorCount} erreurs TypeScript détectées`,
        severity: "error",
      });
    } else {
      addResult({
        name: "TypeScript",
        status: "✅",
        message: "Aucune erreur TypeScript",
        severity: "info",
      });
    }
  } catch (error) {
    addResult({
      name: "TypeScript",
      status: "⚠️",
      message: "Impossible de vérifier TypeScript",
      severity: "warning",
    });
  }
}

// 3. Vérifier les imports
function checkImports() {
  try {
    const dbFile = fs.readFileSync("server/db.ts", "utf-8");

    // Vérifier les imports dupliqués
    const imports = dbFile.match(/^import.*from/gm) || [];
    const importSet = new Set(imports);

    if (imports.length !== importSet.size) {
      addResult({
        name: "Imports",
        status: "⚠️",
        message: "Imports dupliqués détectés dans db.ts",
        severity: "warning",
      });
    } else {
      addResult({
        name: "Imports",
        status: "✅",
        message: "Aucun import dupliqué",
        severity: "info",
      });
    }

    // Vérifier les exports utilisés
    const exports = dbFile.match(/^export (async )?function \w+/gm) || [];
    const unusedExports: string[] = [];

    exports.forEach(exp => {
      const funcName = exp.match(/function (\w+)/)?.[1];
      if (funcName) {
        const regex = new RegExp(`\\b${funcName}\\b`, "g");
        const matches = (dbFile.match(regex) || []).length;
        if (matches === 1) {
          unusedExports.push(funcName);
        }
      }
    });

    if (unusedExports.length > 0) {
      addResult({
        name: "Unused Exports",
        status: "⚠️",
        message: `${unusedExports.length} exports potentiellement inutilisés`,
        severity: "warning",
      });
    } else {
      addResult({
        name: "Unused Exports",
        status: "✅",
        message: "Aucun export inutilisé détecté",
        severity: "info",
      });
    }
  } catch (error) {
    addResult({
      name: "Imports",
      status: "⚠️",
      message: "Impossible de vérifier les imports",
      severity: "warning",
    });
  }
}

// 4. Vérifier la base de données
function checkDatabase() {
  try {
    const schemaFile = fs.readFileSync("drizzle/schema.ts", "utf-8");

    // Vérifier les tables critiques
    const criticalTables = ["members", "adhesions", "cotisationCriteria"];
    const missingTables = criticalTables.filter(
      table => !schemaFile.includes(`export const ${table}`)
    );

    if (missingTables.length > 0) {
      addResult({
        name: "Database Schema",
        status: "❌",
        message: `Tables manquantes: ${missingTables.join(", ")}`,
        severity: "error",
      });
    } else {
      addResult({
        name: "Database Schema",
        status: "✅",
        message: "Toutes les tables critiques présentes",
        severity: "info",
      });
    }

    // Vérifier les colonnes critiques
    const criticalColumns = {
      members: ["memberId", "cotisationStatus"],
      adhesions: ["memberId", "gender"],
    };

    let allColumnsPresent = true;
    for (const [table, columns] of Object.entries(criticalColumns)) {
      for (const col of columns) {
        if (!schemaFile.includes(`${col}:`)) {
          allColumnsPresent = false;
          break;
        }
      }
    }

    if (!allColumnsPresent) {
      addResult({
        name: "Database Columns",
        status: "⚠️",
        message: "Certaines colonnes critiques pourraient être manquantes",
        severity: "warning",
      });
    } else {
      addResult({
        name: "Database Columns",
        status: "✅",
        message: "Toutes les colonnes critiques présentes",
        severity: "info",
      });
    }
  } catch (error) {
    addResult({
      name: "Database Schema",
      status: "⚠️",
      message: "Impossible de vérifier le schéma",
      severity: "warning",
    });
  }
}

// 5. Vérifier les fichiers de configuration
function checkConfiguration() {
  const configFiles = [
    "vite.config.ts",
    "tsconfig.json",
    "drizzle.config.ts",
    ".env.example",
  ];

  const missingFiles = configFiles.filter(file => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    addResult({
      name: "Configuration Files",
      status: "⚠️",
      message: `Fichiers manquants: ${missingFiles.join(", ")}`,
      severity: "warning",
    });
  } else {
    addResult({
      name: "Configuration Files",
      status: "✅",
      message: "Tous les fichiers de configuration présents",
      severity: "info",
    });
  }
}

// 6. Vérifier les tests
function checkTests() {
  try {
    const testFiles = fs
      .readdirSync("server")
      .filter(f => f.endsWith(".test.ts"));

    if (testFiles.length === 0) {
      addResult({
        name: "Tests",
        status: "⚠️",
        message: "Aucun fichier de test trouvé",
        severity: "warning",
      });
    } else {
      addResult({
        name: "Tests",
        status: "✅",
        message: `${testFiles.length} fichiers de test trouvés`,
        severity: "info",
      });
    }
  } catch (error) {
    addResult({
      name: "Tests",
      status: "⚠️",
      message: "Impossible de vérifier les tests",
      severity: "warning",
    });
  }
}

// 7. Vérifier les migrations
function checkMigrations() {
  try {
    const migrationFiles = fs
      .readdirSync("drizzle")
      .filter(f => f.endsWith(".sql"));

    if (migrationFiles.length === 0) {
      addResult({
        name: "Migrations",
        status: "⚠️",
        message: "Aucune migration trouvée",
        severity: "warning",
      });
    } else {
      addResult({
        name: "Migrations",
        status: "✅",
        message: `${migrationFiles.length} migrations trouvées`,
        severity: "info",
      });
    }
  } catch (error) {
    addResult({
      name: "Migrations",
      status: "⚠️",
      message: "Impossible de vérifier les migrations",
      severity: "warning",
    });
  }
}

// Exécuter tous les checks
function runHealthChecks() {
  log(colors.blue, "\n🏥 Démarrage des vérifications de santé du projet...\n");

  checkDependencies();
  checkTypeScript();
  checkImports();
  checkDatabase();
  checkConfiguration();
  checkTests();
  checkMigrations();

  // Résumé
  const errors = results.filter(r => r.severity === "error");
  const warnings = results.filter(r => r.severity === "warning");
  const infos = results.filter(r => r.severity === "info");

  log(colors.blue, "\n📊 Résumé:\n");
  log(colors.green, `✅ ${infos.length} vérifications réussies`);
  log(colors.yellow, `⚠️ ${warnings.length} avertissements`);
  log(colors.red, `❌ ${errors.length} erreurs`);

  if (errors.length > 0) {
    log(colors.red, "\n❌ Le projet a des erreurs critiques!");
    process.exit(1);
  } else if (warnings.length > 0) {
    log(colors.yellow, "\n⚠️ Le projet a des avertissements à vérifier");
    process.exit(0);
  } else {
    log(colors.green, "\n✅ Le projet est en bonne santé!");
    process.exit(0);
  }
}

runHealthChecks();
