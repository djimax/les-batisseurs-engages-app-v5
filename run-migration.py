#!/usr/bin/env python3
import mysql.connector
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs

# Load environment variables
load_dotenv('.env.local')

# Get database connection string
database_url = os.getenv('DATABASE_URL')

if not database_url:
    print('ERROR: DATABASE_URL not set in .env.local')
    exit(1)

try:
    # Parse the connection string using urllib
    parsed = urlparse(database_url)
    
    host = parsed.hostname
    port = parsed.port or 3306
    user = parsed.username
    password = parsed.password
    db = parsed.path.lstrip('/')
    
    # Remove query parameters from database name
    if '?' in db:
        db = db.split('?')[0]
    
    print(f'Connecting to {host}:{port}/{db}...')
    
    # Connect to database
    connection = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=db,
        port=port,
        ssl_disabled=False,
        use_pure=True
    )
    
    cursor = connection.cursor()
    
    # Read and execute migration SQL
    with open('drizzle/0007_create_projects_tasks.sql', 'r') as f:
        sql_content = f.read()
    
    # Split by semicolon and execute each statement
    statements = [s.strip() for s in sql_content.split(';') if s.strip()]
    
    for statement in statements:
        print(f'Executing: {statement[:50]}...')
        cursor.execute(statement)
    
    connection.commit()
    print('✅ Migration completed successfully!')
    
    # Now add the test project
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
    
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
