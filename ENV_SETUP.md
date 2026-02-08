# Environment Configuration Template

Copy this file to `.env` in the backend directory and fill in your actual values.

## Quick Start

1. Copy this file: `cp .env.example .env`
2. Fill in all the required values
3. Never commit the `.env` file to version control

## Required Services

### MongoDB
- Local: Install MongoDB and use default connection
- Cloud: Create free account at https://www.mongodb.com/cloud/atlas

### Google OAuth
- Setup at: https://console.cloud.google.com/
- Create project → Enable Google+ API → Create credentials

### Stripe
- Setup at: https://stripe.com/
- Get API keys from Dashboard → Developers → API keys

### Nodemailer (Gmail)
- Enable 2FA on Gmail
- Generate app password: Google Account → Security → App passwords

## Security Notes

- Change all secret keys before production
- Use strong, unique values for JWT_SECRET and SESSION_SECRET
- Keep .env file secure and never share publicly
- Use environment variables in production hosting platforms

