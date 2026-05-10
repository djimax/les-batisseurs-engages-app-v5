import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

async function addTestProject() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    const projectName = "Projet Test - Rénovation Bâtiment";
    const description =
      "Projet de test pour vérifier le fonctionnement du système de gestion de projets";
    const startDate = new Date("2026-04-15");
    const endDate = new Date("2026-06-30");
    const budget = 50000;
    const status = "en_cours"; // Must be one of: planification, en_cours, suspendu, termine, annule
    const priority = "Haute"; // Must be one of: Basse, Moyenne, Haute
    const createdBy = 1; // Admin user ID

    // Insert project
    const [projectResult] = await connection.execute(
      `INSERT INTO projects (name, description, startDate, endDate, budget, status, priority, createdBy, progress) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectName,
        description,
        startDate,
        endDate,
        budget,
        status,
        priority,
        createdBy,
        25,
      ]
    );

    const projectId = projectResult.insertId;
    console.log(`✅ Project created with ID: ${projectId}`);

    // Add some test tasks
    const tasks = [
      {
        title: "Planification et devis",
        status: "completed",
        priority: "Haute",
      },
      {
        title: "Commande des matériaux",
        status: "in_progress",
        priority: "Haute",
      },
      { title: "Préparation du site", status: "pending", priority: "Moyenne" },
      { title: "Travaux de rénovation", status: "pending", priority: "Haute" },
      {
        title: "Finitions et nettoyage",
        status: "pending",
        priority: "Moyenne",
      },
    ];

    for (const task of tasks) {
      await connection.execute(
        `INSERT INTO tasks (projectId, title, status, priority, createdBy) 
         VALUES (?, ?, ?, ?, ?)`,
        [projectId, task.title, task.status, task.priority, createdBy]
      );
    }

    console.log(`✅ ${tasks.length} test tasks created`);

    console.log(`\n✅ Test project added successfully!`);
    console.log(`📋 Project: ${projectName}`);
    console.log(`💰 Budget: ${budget} €`);
    console.log(
      `📅 Duration: ${startDate.toLocaleDateString("fr-FR")} to ${endDate.toLocaleDateString("fr-FR")}`
    );
    console.log(`🎯 Priority: ${priority}`);
    console.log(`📊 Status: ${status}`);
    console.log(
      `\nYou can now view this project in the application at /projects`
    );
  } catch (error) {
    console.error("Error adding test project:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addTestProject();
