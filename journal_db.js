const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Mamtajaggi1',
  database: 'mindease',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create journal entries table if it doesn't exist
async function initializeJournalTable() {
  try {
    const connection = await pool.getConnection();
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        entry_date DATE NOT NULL,
        content TEXT NOT NULL,
        mood VARCHAR(50),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_user_date (user_id, entry_date)
      )
    `);
    connection.release();
    console.log('Journal table initialized successfully');
  } catch (error) {
    console.error('Error initializing journal table:', error);
  }
}

// Save a new journal entry
async function saveJournalEntry(userId, entryDate, content, mood, tags) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'INSERT INTO journal_entries (user_id, entry_date, content, mood, tags) VALUES (?, ?, ?, ?, ?)',
      [userId, entryDate, content, mood, JSON.stringify(tags)]
    );
    connection.release();
    return result.insertId;
  } catch (error) {
    console.error('Error saving journal entry:', error);
    throw error;
  }
}

// Get all journal entries for a user
async function getJournalEntries(userId) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC',
      [userId]
    );
    connection.release();
    return rows;
  } catch (error) {
    console.error('Error getting journal entries:', error);
    throw error;
  }
}

// Get a specific journal entry
async function getJournalEntry(entryId, userId) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );
    connection.release();
    return rows[0];
  } catch (error) {
    console.error('Error getting journal entry:', error);
    throw error;
  }
}

// Update a journal entry
async function updateJournalEntry(entryId, userId, content, mood, tags) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE journal_entries SET content = ?, mood = ?, tags = ? WHERE id = ? AND user_id = ?',
      [content, mood, JSON.stringify(tags), entryId, userId]
    );
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

// Delete a journal entry
async function deleteJournalEntry(entryId, userId) {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.execute(
      'DELETE FROM journal_entries WHERE id = ? AND user_id = ?',
      [entryId, userId]
    );
    connection.release();
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

// Get journal statistics for a user
async function getJournalStats(userId) {
  try {
    const connection = await pool.getConnection();
    
    // Get total entries
    const [totalEntries] = await connection.execute(
      'SELECT COUNT(*) as total FROM journal_entries WHERE user_id = ?',
      [userId]
    );
    
    // Get monthly entries - only count entries from the current month
    const [monthlyEntries] = await connection.execute(
      'SELECT COUNT(*) as monthly FROM journal_entries WHERE user_id = ? AND MONTH(entry_date) = MONTH(CURRENT_DATE()) AND YEAR(entry_date) = YEAR(CURRENT_DATE())',
      [userId]
    );
    
    // Get most common mood
    const [moodResult] = await connection.execute(
      'SELECT mood, COUNT(*) as count FROM journal_entries WHERE user_id = ? GROUP BY mood ORDER BY count DESC LIMIT 1',
      [userId]
    );
    
    // Get streak information
    const [streakResult] = await connection.execute(
      `SELECT entry_date FROM journal_entries 
       WHERE user_id = ? 
       ORDER BY entry_date DESC`,
      [userId]
    );
    
    connection.release();
    
    // Calculate streak
    let streak = 0;
    if (streakResult.length > 0) {
      let currentStreak = 1;
      let lastDate = new Date(streakResult[0].entry_date);
      
      for (let i = 1; i < streakResult.length; i++) {
        const currentDate = new Date(streakResult[i].entry_date);
        const diffDays = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          lastDate = currentDate;
        } else {
          break;
        }
      }
      
      streak = currentStreak;
    }
    
    // Return stats with default values if no data is found
    return {
      total: totalEntries[0]?.total || 0,
      monthly: monthlyEntries[0]?.monthly || 0,
      mostCommonMood: moodResult[0]?.mood || 'Not specified',
      streak: streak
    };
  } catch (error) {
    console.error('Error getting journal stats:', error);
    // Return default values in case of error
    return {
      total: 0,
      monthly: 0,
      mostCommonMood: 'Not specified',
      streak: 0
    };
  }
}

// Get journal entries for a specific date range
async function getJournalEntriesByDateRange(userId, startDate, endDate) {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM journal_entries WHERE user_id = ? AND entry_date BETWEEN ? AND ? ORDER BY entry_date DESC',
      [userId, startDate, endDate]
    );
    connection.release();
    return rows;
  } catch (error) {
    console.error('Error getting journal entries by date range:', error);
    throw error;
  }
}

module.exports = {
  initializeJournalTable,
  saveJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  getJournalStats,
  getJournalEntriesByDateRange
}; 