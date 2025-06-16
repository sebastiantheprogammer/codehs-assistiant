# CodeHS Assistant Backend

This is the backend server for the CodeHS Assistant extension website.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```
PORT=3000
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri
```

3. Start the development server:
```bash
npm run dev
```

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add all variables from your `.env` file

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/create-payment-intent` - Create Stripe payment intent
- `GET /api/download-extension` - Download the extension (requires authentication)

## Security Notes

- Never commit the `.env` file to version control
- Keep your Stripe secret key secure
- Use HTTPS in production
- Implement proper authentication before allowing extension downloads 