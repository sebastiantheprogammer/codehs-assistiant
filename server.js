require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

// Clean up the Stripe secret key (remove newlines, spaces, etc.)
const cleanStripeKey = (key) => {
  if (!key) return null;
  return key.replace(/\s+/g, '').trim();
};

const stripe = require('stripe')(cleanStripeKey(process.env.STRIPE_SECRET_KEY));

const app = express();
const PORT = process.env.PORT || 3000;

// Store activation codes in memory (in production, use a database)
const activationCodes = new Map();

// Middleware
app.use(cors());

// Special handling for Stripe webhooks - must be raw body
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

// Regular JSON parsing for other routes
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

// Test endpoint to manually generate activation code (for debugging)
app.post('/api/test-generate-code', (req, res) => {
  try {
    const { sessionId, amount = 10000 } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }
    
    // Generate activation code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365); // 1 year
    
    activationCodes.set(code, {
      code,
      expiryDate,
      used: false,
      customerEmail: 'test@example.com',
      sessionId: sessionId
    });
    
    console.log('Manually generated test code:', code, 'for session:', sessionId);
    
    res.json({ 
      code,
      sessionId,
      amount,
      message: 'Test activation code generated successfully'
    });
  } catch (error) {
    console.error('Error generating test code:', error);
    res.status(500).json({ error: 'Failed to generate test code' });
  }
});

// Get activation code by session ID
app.post('/api/get-activation-code', async (req, res) => {
  try {
    const { sessionId } = req.body;
    let session; // Declare session here to make it available in the whole function

    console.log('Looking for activation code for session:', sessionId);

    if (!sessionId) {
      console.log('No session ID provided');
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Check if Stripe secret key is available
    const stripeKey = cleanStripeKey(process.env.STRIPE_SECRET_KEY);
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY not found in environment');
      return res.status(500).json({ error: 'Stripe configuration missing' });
    }

    // Retrieve the session from Stripe
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Stripe session found:', session ? 'Yes' : 'No');
      console.log('Session amount:', session?.amount_total);

      if (!session) {
        console.log('Session not found in Stripe');
        return res.status(404).json({ error: 'Session not found' });
      }
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError.message);
      return res.status(500).json({ error: `Stripe error: ${stripeError.message}` });
    }

    // Find the activation code for this session
    let activationCode = null;
    console.log('Current activation codes in memory:', Array.from(activationCodes.keys()));

    for (const [code, data] of activationCodes.entries()) {
      console.log('Checking code:', code, 'sessionId:', data.sessionId, 'against:', sessionId);
      if (data.sessionId === sessionId) {
        activationCode = code;
        console.log('Found matching activation code:', code);
        break;
      }
    }

    if (!activationCode) {
      console.log('No activation code found for session:', sessionId);
      return res.status(404).json({ error: 'Activation code not found' });
    }

    console.log('Returning activation code:', activationCode);
    res.json({
      code: activationCode,
      amount: session.amount_total
    });
  } catch (error) {
    console.error('Error getting activation code:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: `Failed to get activation code: ${error.message}` });
  }
});

// Stripe webhook endpoint for payment confirmation
app.post('/api/stripe-webhook', async (req, res) => {
  console.log('Webhook received');
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature with raw body
    event = stripe.webhooks.constructEvent(req.body, sig, cleanStripeKey(process.env.STRIPE_WEBHOOK_SECRET));
    console.log('Webhook verified, event type:', event.type);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment completed for session:', session.id);
      console.log('Session amount:', session.amount_total);
      console.log('Customer email:', session.customer_details?.email);
      
      // Generate activation code based on the product
      let durationValue = 30;
      let durationUnit = 'days';
      
      // Determine duration based on product ID or amount
      if (session.amount_total === 10000) { // $100.00 for yearly
        durationValue = 365;
        durationUnit = 'days';
        console.log('Detected yearly pass ($100.00)');
      } else if (session.amount_total === 8000) { // $80.00 for monthly
        durationValue = 30;
        durationUnit = 'days';
        console.log('Detected monthly pass ($80.00)');
      } else if (session.amount_total === 5000) { // $50.00 for weekly
        durationValue = 7;
        durationUnit = 'days';
        console.log('Detected weekly pass ($50.00)');
      } else if (session.amount_total === 1499) { // $14.99 for daily
        durationValue = 1;
        durationUnit = 'days';
        console.log('Detected daily pass ($14.99)');
      } else {
        console.log('Unknown amount, using default 30 days:', session.amount_total);
      }
      
      // Generate activation code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const expiryDate = new Date();
      
      switch (durationUnit) {
        case 'days':
          expiryDate.setDate(expiryDate.getDate() + durationValue);
          break;
        case 'weeks':
          expiryDate.setDate(expiryDate.getDate() + durationValue * 7);
          break;
        case 'months':
          expiryDate.setMonth(expiryDate.getMonth() + durationValue);
          break;
        default:
          expiryDate.setDate(expiryDate.getDate() + 30);
      }

      activationCodes.set(code, {
        code,
        expiryDate,
        used: false,
        customerEmail: session.customer_details?.email || 'unknown',
        sessionId: session.id
      });

      console.log('Generated activation code:', code, 'for customer:', session.customer_details?.email);
      console.log('Code expires:', expiryDate);
      console.log('Total codes in memory:', activationCodes.size);
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
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
  // Check if user has a valid activation code in session/cookie
  // For now, we'll allow downloads but you can add authentication later
  const extensionPath = path.join(__dirname, 'extension');
  
  // Check if the extension directory exists
  if (!require('fs').existsSync(extensionPath)) {
    return res.status(404).json({ error: 'Extension not found' });
  }
  
  // For now, we'll serve the extension as a zip file
  // You'll need to create the zip file manually or use a library
  const zipPath = path.join(__dirname, 'extension.zip');
  
  if (require('fs').existsSync(zipPath)) {
    res.download(zipPath, 'CodeHS-Assistant-Extension.zip');
  } else {
    // If zip doesn't exist, serve the extension directory as a tar.gz
    res.status(404).json({ 
      error: 'Extension download not available',
      message: 'Please contact support for manual download'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 