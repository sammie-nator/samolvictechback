# SAMOLVIC Technologies - Environment Setup & Deployment Guide

## Frontend Environment Variables (.env)

Create a `.env` file in the frontend root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=SAMOLVIC Technologies
```

For production:
```env
VITE_API_URL=https://api.samolvic.com/api
VITE_APP_NAME=SAMOLVIC Technologies
```

---

## Backend Environment Variables (.env)

Create a `.env` file in the backend root directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb://localhost:27017/samolvic

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@samolvic.com
ADMIN_EMAIL=admin@samolvic.com

# M-Pesa Daraja (Sandbox)
MPESA_CONSUMER_KEY=your-daraja-consumer-key
MPESA_CONSUMER_SECRET=your-daraja-consumer-secret
MPESA_SHORT_CODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd1a503f6015edf37d4f2e25029d7bc8edc37ed4e

# Paystack
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key

# Admin
ADMIN_EMAIL=admin@samolvic.com
```

---

## Local Development Setup

### Prerequisites
- Node.js v16+ and npm
- MongoDB (local or Atlas)
- Git

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on `http://localhost:5000`

---

## Database Setup

### MongoDB Local

```bash
# Install MongoDB Community Edition
# macOS (with Homebrew):
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Then create database:
mongo
> use samolvic
> db.createCollection("inquiries")
> db.createCollection("bookings")
> db.createCollection("payments")
> db.createCollection("admin_users")
```

### MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

---

## Payment Integration Setup

### M-Pesa Daraja Setup

1. Visit https://developer.safaricom.co.ke
2. Register and create app
3. Get Consumer Key and Consumer Secret
4. Update `.env`:
   ```env
   MPESA_CONSUMER_KEY=your-key
   MPESA_CONSUMER_SECRET=your-secret
   ```

### Paystack Setup

1. Go to https://paystack.com
2. Create account
3. Get API keys from dashboard
4. Update `.env`:
   ```env
   PAYSTACK_PUBLIC_KEY=pk_test_...
   PAYSTACK_SECRET_KEY=sk_test_...
   ```

---

## Email Setup (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

---

## Deployment Guide

### Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel

# During deployment, add environment variables
VITE_API_URL=https://your-backend-url/api
```

### Deploy Backend (Heroku/Railway/Render)

#### Using Heroku:

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create samolvic-api

# Add environment variables
heroku config:set MONGODB_URI=your-mongodb-atlas-url
heroku config:set JWT_SECRET=your-secret
heroku config:set MPESA_CONSUMER_KEY=your-key
# ... add all env variables

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### Using Railway:

1. Connect GitHub repo to Railway
2. Add environment variables in Railway dashboard
3. Deploy automatically on git push

#### Using Render:

1. Connect GitHub repo to Render
2. Create Web Service
3. Add environment variables
4. Deploy

---

## Database Backup & Migration

### MongoDB Backup

```bash
# Local backup
mongodump --db samolvic --out ./backup

# Atlas Backup (automatic)
# Go to Atlas Dashboard > Backups > Restore
```

### Seed Initial Data

```javascript
// scripts/seed.js
import { AdminUser } from './backend/models.js'
import bcryptjs from 'bcryptjs'
import mongoose from 'mongoose'

mongoose.connect(process.env.MONGODB_URI)

const seedAdmin = async () => {
  const hashedPassword = await bcryptjs.hash('changeme123', 10)
  
  const admin = new AdminUser({
    email: 'admin@samolvic.com',
    password: hashedPassword,
    name: 'Samuel Mugo',
    role: 'admin',
    isActive: true
  })
  
  await admin.save()
  console.log('Admin user created')
  process.exit(0)
}

seedAdmin()
```

Run: `node scripts/seed.js`

---

## Production Checklist

- [ ] Environment variables set for production
- [ ] MongoDB URI points to production database
- [ ] Email service configured with production email
- [ ] Payment keys are for production (not sandbox)
- [ ] JWT secret is strong and unique
- [ ] CORS origin set to production domain
- [ ] Database backups configured
- [ ] Error logging set up (Sentry, LogRocket, etc)
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Admin credentials changed from default
- [ ] Health check monitoring set up
- [ ] CDN configured for static assets

---

## Troubleshooting

### CORS Error
```
Solution: Check FRONTEND_URL in .env matches your frontend domain
```

### M-Pesa Callback Not Working
```
Solution: Ensure API_URL in .env is publicly accessible
Test: curl -X POST https://your-api.com/api/payments/mpesa/callback
```

### Email Not Sending
```
Solution: Check EMAIL_USER and EMAIL_PASSWORD in .env
Enable "Less secure app access" or use App Password (Gmail)
Check spam folder
```

### Database Connection Error
```
Solution: Verify MONGODB_URI is correct
Check firewall/IP whitelist if using Atlas
Ensure MongoDB service is running locally
```

---

## Monitoring & Logging

### Recommended Services

- **Error Tracking:** Sentry (https://sentry.io)
- **Uptime Monitoring:** UptimeRobot (https://uptimerobot.com)
- **Performance:** New Relic or Datadog
- **Analytics:** Google Analytics + Hotjar

### Set Up Sentry

```bash
npm install @sentry/node

# In server.js:
import * as Sentry from "@sentry/node"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})

app.use(Sentry.Handlers.errorHandler())
```

---

## Regular Maintenance

- [ ] Weekly: Check admin panel for new inquiries/bookings
- [ ] Weekly: Review payment logs
- [ ] Monthly: Database optimization
- [ ] Monthly: Security updates for dependencies
- [ ] Quarterly: Full backup test
- [ ] Quarterly: Performance audit
- [ ] Annually: Security audit

---

## Support & Documentation

- MongoDB Docs: https://docs.mongodb.com
- Express.js: https://expressjs.com
- React: https://react.dev
- Vite: https://vitejs.dev
- Daraja API: https://developer.safaricom.co.ke
- Paystack API: https://paystack.com/docs/api

---

## Contact

For questions or support:
- Email: hello@samolvic.com
- Phone: +254 712 345 678
- Location: Kikuyu, Kenya
