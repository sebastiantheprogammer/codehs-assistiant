require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('website')); // Serve static files from website directory

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
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