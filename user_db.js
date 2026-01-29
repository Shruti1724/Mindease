const mysql = require('mysql2/promise');


require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


// Create users table if it doesn't exist
async function initializeUsersTable() {
  try {
    const connection = await pool.getConnection();
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log('✅ Users table initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing users table:', error);
  }
}

// Add a test user
async function addTestUser() {
  try {
    const connection = await pool.getConnection();
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['test@example.com']
    );
    
    if (existingUsers.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('test123', 10);
      
      await connection.execute(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        ['Test User', 'test@example.com', hashedPassword]
      );
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user already exists');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

module.exports = {
  initializeUsersTable,
  addTestUser,
  pool
}; 