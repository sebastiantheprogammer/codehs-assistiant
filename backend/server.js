require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Store activation codes in memory (in production, use a database)
const activationCodes = new Map();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('website')); // Serve static files from website directory

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Activate extension
app.post('/api/activate', (req, res) => {
  try {
    const { activationCode } = req.body;
    const codeData = activationCodes.get(activationCode);

    if (!codeData) {
      return res.status(400).json({ error: 'Invalid activation code' });
    }

    if (codeData.used) {
      return res.status(400).json({ error: 'Code already used' });
    }

    if (new Date(codeData.expiryDate) < new Date()) {
      return res.status(400).json({ error: 'Code expired' });
    }

    // Mark code as used
    codeData.used = true;
    activationCodes.set(activationCode, codeData);

    res.json({ 
      valid: true,
      expiryDate: codeData.expiryDate
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate extension' });
  }
});

// Generate activation code
app.post('/api/generate-code', (req, res) => {
  try {
    // Generate a random 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const { durationValue = 30, durationUnit = 'days' } = req.body;
    const expiryDate = new Date();
    const value = parseInt(durationValue, 10) || 30;
    switch (durationUnit) {
      case 'seconds':
        expiryDate.setSeconds(expiryDate.getSeconds() + value);
        break;
      case 'minutes':
        expiryDate.setMinutes(expiryDate.getMinutes() + value);
        break;
      case 'hours':
        expiryDate.setHours(expiryDate.getHours() + value);
        break;
      case 'days':
        expiryDate.setDate(expiryDate.getDate() + value);
        break;
      case 'weeks':
        expiryDate.setDate(expiryDate.getDate() + value * 7);
        break;
      case 'months':
        expiryDate.setMonth(expiryDate.getMonth() + value);
        break;
      default:
        expiryDate.setDate(expiryDate.getDate() + 30);
    }

    activationCodes.set(code, {
      code,
      expiryDate,
      used: false
    });

    res.json({ code });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// Get all active codes
app.get('/api/active-codes', (req, res) => {
  try {
    const codes = Array.from(activationCodes.values())
      .filter(code => !code.used && new Date(code.expiryDate) > new Date())
      .map(code => ({
        code: code.code,
        expiryDate: code.expiryDate
      }));
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

// Verify activation code
app.post('/api/verify-code', (req, res) => {
  try {
    const { code } = req.body;
    const codeData = activationCodes.get(code);

    if (!codeData) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    if (codeData.used) {
      return res.status(400).json({ error: 'Code already used' });
    }

    if (new Date(codeData.expiryDate) < new Date()) {
      return res.status(400).json({ error: 'Code expired' });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Stripe payment endpoint
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Extension download endpoint
app.get('/api/download-extension', (req, res) => {
  // TODO: Add authentication and access control
  const extensionPath = path.join(__dirname, 'extension');
  res.download(path.join(extensionPath, 'codehs-assistant.zip'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 