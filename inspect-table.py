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
    
    # Get table structure
    print('\n📋 Projects table structure:')
    cursor.execute("DESCRIBE projects")
    for row in cursor.fetchall():
        print(f'  {row}')
    
    # Get CREATE TABLE statement
    print('\n📋 Projects CREATE TABLE statement:')
    cursor.execute("SHOW CREATE TABLE projects")
    for row in cursor.fetchall():
        print(f'{row[1]}')
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f'ERROR: {e}')
    import traceback
    traceback.print_exc()
    exit(1)
