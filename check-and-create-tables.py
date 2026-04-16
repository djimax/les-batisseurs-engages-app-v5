#!/usr/bin/env python3
import mysql.connector
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables
load_dotenv('.env.local')

# Get database connection string
database_url = os.getenv('DATABASE_URL')

if not database_url:
    print('ERROR: DATABASE_URL not set in .env.local')
    exit(1)

try:
    # Parse the connection string
    parsed = urlparse(database_url)
    
    host = parsed.hostname
    port = parsed.port or 3306
    user = parsed.username
    password = parsed.password
    db = parsed.path.lstrip('/').split('?')[0]
    
    print(f'Connecting to {host}:{port}/{db}...')
    
    # Connect to database
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=db,
        port=port,
        use_pure=True
    )
    
    cursor = connection.cursor()
    
    # Check if projects table exists
    cursor.execute("SHOW TABLES LIKE 'projects'")
    if cursor.fetchone():
        print('✅ projects table exists')
    else:
        print('❌ projects table does NOT exist')
        print('\nCreating projects table...')
        cursor.execute("""
        CREATE TABLE `projects` (
          `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
          `name` varchar(255) NOT NULL,
          `description` text,
          `status` enum('planification','en_cours','suspendu','termine','annule') DEFAULT 'planification' NOT NULL,
          `priority` enum('Basse','Moyenne','Haute') DEFAULT 'Moyenne' NOT NULL,
          `startDate` timestamp NULL,
          `endDate` timestamp NULL,
          `budget` decimal(12,2) DEFAULT '0',
          `progress` int DEFAULT 0,
          `createdBy` int,
          `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
        )
        """)
        connection.commit()
        print('✅ projects table created')
    
    # Check if tasks table exists
    cursor.execute("SHOW TABLES LIKE 'tasks'")
    if cursor.fetchone():
        print('✅ tasks table exists')
    else:
        print('❌ tasks table does NOT exist')
        print('\nCreating tasks table...')
        cursor.execute("""
        CREATE TABLE `tasks` (
          `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
          `projectId` int NOT NULL,
          `title` varchar(255) NOT NULL,
          `description` text,
          `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending' NOT NULL,
          `priority` enum('Basse','Moyenne','Haute') DEFAULT 'Moyenne' NOT NULL,
          `dueDate` timestamp NULL,
          `assignedTo` int,
          `createdBy` int,
          `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
          FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
          FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
        )
        """)
        connection.commit()
        print('✅ tasks table created')
    
    # Now add the test project
    print('\n✅ All tables ready!')
    print('\nAdding test project...')
    
    insert_project = """
    INSERT INTO projects (name, description, startDate, endDate, budget, status, priority, createdBy, progress) 
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    
    project_data = (
        'Projet Test - Rénovation Bâtiment',
        'Projet de test pour vérifier le fonctionnement du système de gestion de projets',
        '2026-04-15',
        '2026-06-30',
        50000,
        'en_cours',
        'Haute',
        1,  # createdBy = admin user
        25
    )
    
    cursor.execute(insert_project, project_data)
    project_id = cursor.lastrowid
    connection.commit()
    
    print(f'✅ Test project created with ID: {project_id}')
    
    # Add test tasks
    print('Adding test tasks...')
    
    insert_task = """
    INSERT INTO tasks (projectId, title, status, priority, createdBy) 
    VALUES (%s, %s, %s, %s, %s)
    """
    
    tasks = [
        ('Planification et devis', 'completed', 'Haute'),
        ('Commande des matériaux', 'in_progress', 'Haute'),
        ('Préparation du site', 'pending', 'Moyenne'),
        ('Travaux de rénovation', 'pending', 'Haute'),
        ('Finitions et nettoyage', 'pending', 'Moyenne'),
    ]
    
    for title, status, priority in tasks:
        cursor.execute(insert_task, (project_id, title, status, priority, 1))
    
    connection.commit()
    print(f'✅ {len(tasks)} test tasks created')
    
    cursor.close()
    connection.close()
    
    print('\n✅ All operations completed successfully!')
    print(f'\n📋 Test project details:')
    print(f'   Project ID: {project_id}')
    print(f'   Name: Projet Test - Rénovation Bâtiment')
    print(f'   Budget: 50000 €')
    print(f'   Status: en_cours')
    print(f'   Priority: Haute')
    
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
