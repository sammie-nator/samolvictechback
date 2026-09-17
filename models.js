import mongoose from 'mongoose'

// Inquiry Schema
const inquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'replied', 'closed'], default: 'new' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const Inquiry = mongoose.model('Inquiry', inquirySchema)

// Booking Schema
const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  phone: { type: String },
  serviceType: { type: String, enum: ['custom-pwa', 'support', 'consulting'], required: true },
  projectDescription: { type: String, required: true },
  timeline: { type: String, enum: ['asap', 'flexible', 'longterm'], default: 'flexible' },
  budget: { type: String },
  date: { type: Date },
  time: { type: String },
  paymentMethod: { type: String, enum: ['mpesa', 'paystack', 'later'], default: 'mpesa' },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String },
  consultationNotes: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const Booking = mongoose.model('Booking', bookingSchema)

// Payment Schema
const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'KES' },
  method: { type: String, enum: ['mpesa', 'paystack', 'bank'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  transactionId: { type: String, unique: true },
  reference: { type: String },
  mpesaDetails: {
    checkoutRequestId: String,
    resultCode: String,
    resultDesc: String,
    receiptNumber: String
  },
  paystackDetails: {
    authorization_url: String,
    access_code: String,
    reference: String
  },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const Payment = mongoose.model('Payment', paymentSchema)

// Admin User Schema
const adminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed
  name: { type: String },
  role: { type: String, enum: ['admin', 'moderator'], default: 'admin' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const AdminUser = mongoose.model('AdminUser', adminUserSchema)

// Case Study Schema (for portfolio)
const caseStudySchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  tagline: { type: String },
  description: { type: String },
  category: { type: String },
  image: { type: String },
  problem: {
    title: String,
    description: String,
    painPoints: [String]
  },
  solution: {
    title: String,
    description: String,
    features: [String]
  },
  results: {
    title: String,
    metrics: [{
      label: String,
      value: String,
      change: String
    }],
    testimonial: {
      quote: String,
      author: String
    }
  },
  techStack: [String],
  liveLink: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

export const CaseStudy = mongoose.model('CaseStudy', caseStudySchema)
