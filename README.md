# 🚀 CodeHS Assistant

Your Ultimate AI-Powered CodeHS Helper! ✨

## 🌟 Features

- 🤖 Multiple AI Models Support (ChatGPT, Gemini, Deepseek)
- 📝 Instant Assignment Solutions
- 🎯 Smart Code Extraction
- ⚡ Auto-Paste Functionality
- 🔒 Secure API Key Management
- 💳 Flexible Subscription Plans

## 🎮 Quick Start

1. 📥 Download the extension from our [website](https://codehs-assistant.com)
2. 🔑 Get your API key from your preferred AI provider
3. 🎯 Install the extension in Chrome
4. 🚀 Start solving CodeHS assignments with ease!

## 💡 How It Works

1. **Select Your AI Model** 🧠
   - Choose between ChatGPT, Gemini, or Deepseek
   - Each model brings unique capabilities to your coding tasks

2. **Extract Assignment** 📋
   - One-click extraction of CodeHS assignments
   - Smart parsing of requirements and constraints

3. **Get Solutions** 💡
   - Receive detailed, step-by-step solutions
   - Understand the logic behind each answer

4. **Auto-Paste** 📋
   - Seamlessly paste solutions into CodeHS
   - Save time and avoid manual copying

## 🔒 Security & Privacy

- 🔐 End-to-end encryption for all communications
- 🛡️ Secure API key storage
- 🔒 No data collection or tracking
- 🚫 No sharing of your solutions

## 💎 Subscription Plans

- 🌟 Day Pass - Perfect for quick assignments
- 📅 Monthly Pass - Best for regular users
- 📆 Yearly Pass - Ultimate value for dedicated students

## 🛠️ Technical Details

### Backend Requirements
- Node.js 14+
- MongoDB
- Stripe Account (for payments)

### Environment Variables
```
PORT=3000
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri
```

## 🤝 Support

Need help? We're here for you!
- 📧 Email: support@codehs-assistant.com
- 💬 Discord: [Join our community](https://discord.gg/codehs-assistant)
- 📝 Documentation: [Read our guides](https://docs.codehs-assistant.com)

## ⭐ Why Choose CodeHS Assistant?

- 🎯 100% Accurate Solutions
- ⚡ Lightning Fast Response
- 🔄 Multiple AI Models
- 💰 Affordable Pricing
- 🛡️ Secure & Private
- 📚 Educational Value

## 📜 License

MIT License - Feel free to use and modify for your needs!

---

Made with ❤️ by the CodeHS Assistant Team

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