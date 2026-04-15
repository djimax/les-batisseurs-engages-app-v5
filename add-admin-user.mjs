import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set in .env.local');
  process.exit(1);
}

async function addAdminUser() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    const email = 'admin@batisseurs-engages.fr';
    const password = 'Admin1233!Admin1233@';
    const name = 'Admin Bâtisseurs Engagés';
    const openId = `admin-${Date.now()}`;
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    let userId;
    
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
      console.log(`User already exists with ID: ${userId}`);
    } else {
      // Insert into users table
      const [userResult] = await connection.execute(
        'INSERT INTO users (openId, name, email, loginMethod, role) VALUES (?, ?, ?, ?, ?)',
        [openId, name, email, 'email', 'admin']
      );
      
      userId = userResult.insertId;
      console.log(`✅ User created with ID: ${userId}`);
    }
    
    // Check if password already exists
    const [existingPassword] = await connection.execute(
      'SELECT id FROM users_local WHERE userId = ?',
      [userId]
    );
    
    if (existingPassword.length > 0) {
      // Update existing password
      await connection.execute(
        'UPDATE users_local SET passwordHash = ?, isEmailVerified = ? WHERE userId = ?',
        [passwordHash, true, userId]
      );
      console.log(`✅ Password updated for user`);
    } else {
      // Insert into users_local table with hashed password
      await connection.execute(
        'INSERT INTO users_local (userId, email, passwordHash, isEmailVerified) VALUES (?, ?, ?, ?)',
        [userId, email, passwordHash, true]
      );
      console.log(`✅ Password added for user`);
    }
    
    console.log(`\n✅ Admin user configured successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 Password: ${password}`);
    console.log(`👤 Role: admin`);
    
  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addAdminUser();
