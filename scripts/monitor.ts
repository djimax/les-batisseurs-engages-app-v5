#!/usr/bin/env node

/**
 * Real-time Monitoring Script
 * Surveille l'état du projet en continu
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface MonitoringConfig {
  monitoring: {
    enabled: boolean;
    interval: number;
    alerts: Record<string, any>;
    checks: Record<string, any>;
  };
}

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  duration: number;
  message: string;
  timestamp: Date;
}

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[36m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

class ProjectMonitor {
  private config: MonitoringConfig;
  private results: CheckResult[] = [];
  private startTime: Date = new Date();

  constructor() {
    try {
      const configPath = path.join(process.cwd(), "monitoring.config.json");
      this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (error) {
      console.error("❌ Impossible de charger la configuration de monitoring");
      process.exit(1);
    }
  }

  private log(color: string, text: string) {
    const timestamp = new Date().toISOString();
    console.log(
      `${colors.gray}[${timestamp}]${colors.reset} ${color}${text}${colors.reset}`
    );
  }

  private async runCheck(
    name: string,
    command: string,
    timeout: number
  ): Promise<CheckResult> {
    const start = Date.now();
    try {
      execSync(command, { timeout, encoding: "utf-8" });
      const duration = Date.now() - start;
      return {
        name,
        status: "pass",
        duration,
        message: "Vérification réussie",
        timestamp: new Date(),
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      return {
        name,
        status: error.killed ? "fail" : "warn",
        duration,
        message: error.message || "Erreur lors de la vérification",
        timestamp: new Date(),
      };
    }
  }

  async runAllChecks(): Promise<void> {
    this.log(colors.blue, "🔍 Démarrage des vérifications de monitoring...\n");

    const checks = this.config.monitoring.checks;
    const checkPromises: Promise<CheckResult>[] = [];

    for (const [name, check] of Object.entries(checks)) {
      if (check.enabled) {
        checkPromises.push(this.runCheck(name, check.command, check.timeout));
      }
    }

    const results = await Promise.all(checkPromises);
    this.results.push(...results);

    // Afficher les résultats
    this.displayResults(results);

    // Vérifier les alertes
    this.checkAlerts(results);
  }

  private displayResults(results: CheckResult[]): void {
    this.log(colors.cyan, "\n📊 Résultats des vérifications:\n");

    for (const result of results) {
      const statusIcon =
        result.status === "pass"
          ? "✅"
          : result.status === "warn"
            ? "⚠️"
            : "❌";
      const statusColor =
        result.status === "pass"
          ? colors.green
          : result.status === "warn"
            ? colors.yellow
            : colors.red;

      this.log(
        statusColor,
        `${statusIcon} ${result.name.padEnd(20)} ${result.duration.toString().padStart(5)}ms - ${result.message}`
      );
    }
  }

  private checkAlerts(results: CheckResult[]): void {
    const alerts = this.config.monitoring.alerts;
    const failedChecks = results.filter(r => r.status === "fail");

    if (failedChecks.length > 0) {
      this.log(colors.red, "\n🚨 Alertes détectées:\n");

      for (const check of failedChecks) {
        const alertConfig = alerts[check.name];
        if (alertConfig && alertConfig.enabled) {
          this.log(colors.red, `❌ ${check.name}: ${check.message}`);

          if (alertConfig.action === "fail") {
            this.log(colors.red, `   Action: ARRÊT DU MONITORING`);
          } else if (alertConfig.action === "warn") {
            this.log(colors.yellow, `   Action: AVERTISSEMENT`);
          }
        }
      }
    }
  }

  async startContinuousMonitoring(): Promise<void> {
    if (!this.config.monitoring.enabled) {
      this.log(colors.yellow, "⚠️ Le monitoring est désactivé");
      return;
    }

    this.log(colors.green, "✅ Démarrage du monitoring continu...\n");

    // Première vérification
    await this.runAllChecks();

    // Vérifications périodiques
    const interval = setInterval(async () => {
      console.clear();
      this.log(colors.blue, "🔄 Vérification périodique...\n");
      await this.runAllChecks();
    }, this.config.monitoring.interval);

    // Gestion des signaux
    process.on("SIGINT", () => {
      clearInterval(interval);
      this.displaySummary();
      process.exit(0);
    });
  }

  private displaySummary(): void {
    const uptime = Date.now() - this.startTime.getTime();
    const passed = this.results.filter(r => r.status === "pass").length;
    const failed = this.results.filter(r => r.status === "fail").length;
    const warned = this.results.filter(r => r.status === "warn").length;

    this.log(colors.blue, "\n📈 Résumé du monitoring:\n");
    this.log(colors.green, `✅ Réussis: ${passed}`);
    this.log(colors.yellow, `⚠️ Avertissements: ${warned}`);
    this.log(colors.red, `❌ Échoués: ${failed}`);
    this.log(colors.cyan, `⏱️ Durée: ${Math.floor(uptime / 1000)}s`);
  }
}

// Exécuter le monitoring
const monitor = new ProjectMonitor();

if (process.argv.includes("--continuous")) {
  monitor.startContinuousMonitoring().catch(error => {
    console.error("❌ Erreur du monitoring:", error);
    process.exit(1);
  });
} else {
  monitor.runAllChecks().catch(error => {
    console.error("❌ Erreur du monitoring:", error);
    process.exit(1);
  });
}
