const express = require('express');
const { Low, JSONFile } = require('lowdb');
const path = require('path');
const cors = require('cors'); // Import cors
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const port = 3000;

// Use cors middleware
app.use(cors());
app.use(express.json());

// Configure LowDB
const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Read data from db.json, or set initial state if file is empty
async function initializeDb() {
  await db.read();
  db.data = db.data || { apiKeys: [] };
  await db.write();
}

initializeDb();

// Routes for API Key Management

// Get all API keys
app.get('/api/keys', async (req, res) => {
  await db.read();
  res.json(db.data.apiKeys);
});

// Add a new API key
app.post('/api/keys', async (req, res) => {
  const { provider, apiKey, type } = req.body;
  if (!provider || !apiKey || !type) {
    return res.status(400).json({ error: 'Provider, apiKey, and type are required' });
  }

  await db.read();
  db.data.apiKeys.push({ id: Date.now().toString(), provider, apiKey, type });
  await db.write();
  res.status(201).json({ message: 'API key added successfully' });
});

// Update an API key
app.put('/api/keys/:id', async (req, res) => {
  const { id } = req.params;
  const { provider, apiKey, type } = req.body;

  await db.read();
  const keyIndex = db.data.apiKeys.findIndex(key => key.id === id);

  if (keyIndex > -1) {
    db.data.apiKeys[keyIndex] = { ...db.data.apiKeys[keyIndex], provider, apiKey, type };
    await db.write();
    res.json({ message: 'API key updated successfully' });
  } else {
    res.status(404).json({ error: 'API key not found' });
  }
});

// Delete an API key
app.delete('/api/keys/:id', async (req, res) => {
  const { id } = req.params;

  await db.read();
  db.data.apiKeys = db.data.apiKeys.filter(key => key.id !== id);
  await db.write();
  res.json({ message: 'API key deleted successfully' });
});

// Generate activation code
app.post('/api/generate-code', (req, res) => {
  const data = db.data.apiKeys;
  const code = uuidv4();
  const timestamp = Date.now();
  
  data.push({
    id: Date.now().toString(),
    provider: 'admin',
    apiKey: code,
    type: 'admin'
  });
  
  await db.write();
  res.json({ code });
});

// Verify activation code
app.post('/api/verify-code', (req, res) => {
  const { code } = req.body;
  const data = db.data.apiKeys;
  
  const codeEntry = data.find(entry => entry.apiKey === code);
  if (!codeEntry) {
    return res.status(400).json({ error: 'Invalid activation code' });
  }
  
  if (codeEntry.used) {
    return res.status(400).json({ error: 'Code already used' });
  }
  
  // Mark code as used
  codeEntry.used = true;
  await db.write();
  
  res.json({ success: true });
});

// Save API key
app.post('/api/save-key', (req, res) => {
  const { provider, key, type } = req.body;
  const data = db.data.apiKeys;
  
  if (!data.find(entry => entry.provider === provider && entry.type === type)) {
    data.push({
      id: Date.now().toString(),
      provider,
      apiKey: key,
      type
    });
  }
  
  await db.write();
  
  res.json({ success: true });
});

// Get API key
app.get('/api/get-key/:provider/:type', (req, res) => {
  const { provider, type } = req.params;
  const data = db.data.apiKeys;
  
  const key = data.find(entry => entry.provider === provider && entry.type === type)?.apiKey;
  if (!key) {
    return res.status(404).json({ error: 'API key not found' });
  }
  
  res.json({ key });
});

// Get all API keys
app.get('/api/get-keys', (req, res) => {
  const data = db.data.apiKeys;
  res.json(data);
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
}); 