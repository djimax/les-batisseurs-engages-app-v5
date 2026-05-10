#!/usr/bin/env node

/**
 * Webhook Setup Script
 * Configure les webhooks pour les notifications et alertes
 */

import * as fs from "fs";
import * as path from "path";

interface WebhookConfig {
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
}

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

class WebhookSetup {
  private config: any;
  private webhooks: WebhookConfig[] = [];

  constructor() {
    try {
      const configPath = path.join(process.cwd(), "monitoring.config.json");
      this.config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch (error) {
      log(colors.red, "❌ Impossible de charger la configuration");
      process.exit(1);
    }
  }

  setupSlackWebhook(): void {
    log(colors.blue, "\n🔧 Configuration du webhook Slack...\n");

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      log(colors.yellow, "⚠️ SLACK_WEBHOOK_URL non défini");
      log(
        colors.yellow,
        "Définissez la variable d'environnement pour activer Slack"
      );
      return;
    }

    this.webhooks.push({
      name: "Slack Notifications",
      url: webhookUrl,
      events: ["error", "warning", "deployment", "test_failure"],
      active: true,
    });

    log(colors.green, "✅ Webhook Slack configuré");
  }

  setupEmailWebhook(): void {
    log(colors.blue, "\n🔧 Configuration du webhook Email...\n");

    const emailRecipients = process.env.EMAIL_RECIPIENTS;
    if (!emailRecipients) {
      log(colors.yellow, "⚠️ EMAIL_RECIPIENTS non défini");
      return;
    }

    this.webhooks.push({
      name: "Email Notifications",
      url: `mailto:${emailRecipients}`,
      events: ["critical_error", "deployment_success", "deployment_failure"],
      active: true,
    });

    log(colors.green, "✅ Webhook Email configuré");
  }

  setupGitHubWebhook(): void {
    log(colors.blue, "\n🔧 Configuration du webhook GitHub...\n");

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      log(colors.yellow, "⚠️ GITHUB_TOKEN non défini");
      return;
    }

    this.webhooks.push({
      name: "GitHub Integration",
      url: "https://api.github.com/repos/YOUR_REPO/hooks",
      events: ["push", "pull_request", "release"],
      active: true,
      secret: githubToken,
    });

    log(colors.green, "✅ Webhook GitHub configuré");
  }

  setupCustomWebhook(): void {
    log(colors.blue, "\n🔧 Configuration des webhooks personnalisés...\n");

    const customWebhooks = process.env.CUSTOM_WEBHOOKS;
    if (!customWebhooks) {
      log(colors.yellow, "⚠️ CUSTOM_WEBHOOKS non défini");
      return;
    }

    try {
      const webhooks = JSON.parse(customWebhooks);
      webhooks.forEach((webhook: WebhookConfig) => {
        this.webhooks.push(webhook);
      });
      log(
        colors.green,
        `✅ ${webhooks.length} webhooks personnalisés configurés`
      );
    } catch (error) {
      log(colors.red, "❌ Erreur lors du parsing des webhooks personnalisés");
    }
  }

  saveConfiguration(): void {
    log(colors.blue, "\n💾 Sauvegarde de la configuration...\n");

    const webhookConfig = {
      webhooks: this.webhooks,
      lastUpdated: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    };

    const configPath = path.join(process.cwd(), ".webhooks.json");
    fs.writeFileSync(configPath, JSON.stringify(webhookConfig, null, 2));

    log(colors.green, "✅ Configuration sauvegardée");
  }

  testWebhooks(): void {
    log(colors.blue, "\n🧪 Test des webhooks...\n");

    this.webhooks.forEach(webhook => {
      if (webhook.active) {
        log(colors.green, `✅ ${webhook.name}: ${webhook.url}`);
        log(colors.yellow, `   Événements: ${webhook.events.join(", ")}`);
      } else {
        log(colors.yellow, `⚠️ ${webhook.name}: DÉSACTIVÉ`);
      }
    });
  }

  displaySummary(): void {
    log(colors.blue, "\n📊 Résumé de la configuration des webhooks:\n");

    const activeWebhooks = this.webhooks.filter(w => w.active);
    const inactiveWebhooks = this.webhooks.filter(w => !w.active);

    log(colors.green, `✅ Webhooks actifs: ${activeWebhooks.length}`);
    log(colors.yellow, `⚠️ Webhooks inactifs: ${inactiveWebhooks.length}`);
    log(colors.blue, `📝 Total: ${this.webhooks.length}`);

    log(colors.blue, "\n🔔 Événements configurés:");
    const allEvents = new Set<string>();
    this.webhooks.forEach(w => w.events.forEach(e => allEvents.add(e)));
    allEvents.forEach(event => {
      log(colors.green, `  • ${event}`);
    });
  }

  run(): void {
    log(colors.blue, "🚀 Configuration des webhooks...\n");

    this.setupSlackWebhook();
    this.setupEmailWebhook();
    this.setupGitHubWebhook();
    this.setupCustomWebhook();

    if (this.webhooks.length === 0) {
      log(colors.yellow, "\n⚠️ Aucun webhook configuré");
      log(
        colors.yellow,
        "Définissez les variables d'environnement pour activer les webhooks"
      );
      process.exit(1);
    }

    this.saveConfiguration();
    this.testWebhooks();
    this.displaySummary();

    log(colors.green, "\n✅ Configuration des webhooks réussie!");
  }
}

// Exécuter la configuration
const setup = new WebhookSetup();
setup.run();
