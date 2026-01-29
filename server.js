console.log("✅ Server.js file is running");

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const journalDb = require('./journal_db');
const userDb = require('./user_db');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: ['http://127.0.0.1:5505', 'http://localhost:5505', 
          'http://127.0.0.1:5506', 'http://localhost:5506',
          'http://127.0.0.1:5507', 'http://localhost:5507',
          'http://127.0.0.1:3000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.static(path.join(__dirname, './')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize tables
userDb.initializeUsersTable().then(() => {
  userDb.addTestUser();
});
journalDb.initializeJournalTable();

// Authentication middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// User registration
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await userDb.pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    
    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await userDb.pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      userId: user.id, 
      name: user.name, 
      email: user.email 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Journal Routes
app.post('/api/journal/entries', verifyToken, async (req, res) => {
  try {
    const { entryDate, content, mood, tags } = req.body;
    const userId = req.user.userId;
    
    const entryId = await journalDb.saveJournalEntry(userId, entryDate, content, mood, tags);
    res.status(201).json({ id: entryId, message: 'Journal entry saved successfully' });
  } catch (error) {
    console.error('Error saving journal entry:', error);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
});

app.get('/api/journal/entries', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const entries = await journalDb.getJournalEntries(userId);
    res.json(entries);
  } catch (error) {
    console.error('Error getting journal entries:', error);
    res.status(500).json({ error: 'Failed to get journal entries' });
  }
});

app.get('/api/journal/entries/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const entryId = req.params.id;
    const entry = await journalDb.getJournalEntry(entryId, userId);
    
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error getting journal entry:', error);
    res.status(500).json({ error: 'Failed to get journal entry' });
  }
});

app.put('/api/journal/entries/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const entryId = req.params.id;
    const { content, mood, tags } = req.body;
    
    const success = await journalDb.updateJournalEntry(entryId, userId, content, mood, tags);
    
    if (!success) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    res.json({ message: 'Journal entry updated successfully' });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

app.delete('/api/journal/entries/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const entryId = req.params.id;
    
    const success = await journalDb.deleteJournalEntry(entryId, userId);
    
    if (!success) {
      return res.status(404).json({ error: 'Journal entry not found' });
    }
    
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

app.get('/api/journal/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = await journalDb.getJournalStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting journal stats:', error);
    res.status(500).json({ error: 'Failed to get journal statistics' });
  }
});

// API endpoint to handle contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    console.log('Received contact form data:', { name, email, phone, subject, message });
    
    // Prepare SQL statement
    const sql = 'INSERT INTO contact_messages (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, ?)';
    
    // Execute query using async/await
    const [result] = await userDb.pool.execute(sql, [name, email, phone, subject, message, created_at]);
    
    console.log('Successfully inserted contact message:', result);
    
    // Success response
    res.status(200).json({
      status: 'success',
      message: 'Thank you for your message! We will get back to you soon.'
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      status: 'error',
      message: 'Sorry, there was an error submitting your message. Please try again later.'
    });
  }
});

// Get current user's information
app.get('/api/user/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const [results] = await userDb.pool.execute('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = results[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Error fetching user information' });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
