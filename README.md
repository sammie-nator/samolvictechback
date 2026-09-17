# SAMOLVIC Technologies - Backend API

Node.js + Express API for SAMOLVIC Technologies.

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env` file (see `.env.example`).

## Project Structure

- `routes/` - API endpoints
- `utils/` - Helper functions
- `models.js` - MongoDB schemas
- `server.js` - Main server file

## API Endpoints

- POST /api/inquiries - Submit contact inquiry
- GET /api/inquiries - Get all inquiries (admin)
- POST /api/bookings - Create booking
- GET /api/bookings - Get all bookings (admin)
- POST /api/payments/mpesa/init - Initiate M-Pesa payment
- POST /api/payments/paystack/init - Initiate Paystack payment
- POST /api/admin/login - Admin login

## Documentation

See `docs/` folder for complete setup and deployment guide.
