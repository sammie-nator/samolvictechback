// routes/admin.js
import express from 'express'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import { AdminUser } from '../models.js'

const router = express.Router()

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'samolvic-secret')
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    
    const admin = await AdminUser.findOne({ email, isActive: true })
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Check password
    const isPasswordValid = await bcryptjs.compare(password, admin.password)
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    
    // Generate JWT
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET || 'samolvic-secret',
      { expiresIn: '24h' }
    )
    
    res.json({
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin Logout (frontend can just delete token)
router.post('/logout', verifyToken, (req, res) => {
  // Token is invalidated on frontend
  res.json({ success: true, message: 'Logged out' })
})

// Get admin profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.user.id).select('-password')
    res.json(admin)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create new admin user (only existing admin can do this)
router.post('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' })
    }
    
    const { email, password, name, role } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }
    
    // Check if user exists
    const existingUser = await AdminUser.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)
    
    const newUser = new AdminUser({
      email,
      password: hashedPassword,
      name,
      role: role || 'moderator'
    })
    
    await newUser.save()
    
    res.status(201).json({
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update admin user
router.patch('/users/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update users' })
    }
    
    const { name, role, isActive } = req.body
    
    const user = await AdminUser.findByIdAndUpdate(
      req.params.id,
      { name, role, isActive },
      { new: true }
    ).select('-password')
    
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// List all admin users
router.get('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view users' })
    }
    
    const users = await AdminUser.find().select('-password')
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get dashboard stats
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { Inquiry, Booking, Payment } = await import('../models.js')
    
    const inquiries = await Inquiry.countDocuments()
    const bookings = await Booking.countDocuments()
    const pendingPayments = await Payment.countDocuments({ status: 'pending' })
    const completedPayments = await Payment.countDocuments({ status: 'completed' })
    
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    
    res.json({
      inquiries,
      bookings,
      pendingPayments,
      completedPayments,
      totalRevenue: totalRevenue[0]?.total || 0
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

// utils/email.js
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export const sendEmail = async ({ to, subject, template, data }) => {
  try {
    let htmlContent = ''
    
    // Template rendering
    if (template === 'inquiry-confirmation') {
      htmlContent = `
        <h2>Thank you for your inquiry, ${data.name}!</h2>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p>Best regards,<br/>SAMOLVIC Technologies Team</p>
      `
    } else if (template === 'admin-inquiry-notification') {
      htmlContent = `
        <h2>New Inquiry Received</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Message:</strong> ${data.message}</p>
      `
    } else if (template === 'booking-confirmation') {
      htmlContent = `
        <h2>Booking Confirmation, ${data.name}!</h2>
        <p>Your booking has been received. Complete your payment to confirm.</p>
        <p>Booking ID: ${data.bookingId}</p>
        <p><a href="${process.env.FRONTEND_URL}/payment">Complete Payment</a></p>
        <p>Best regards,<br/>SAMOLVIC Technologies Team</p>
      `
    } else if (template === 'admin-booking-notification') {
      htmlContent = `
        <h2>New Booking Received</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Service:</strong> ${data.serviceType}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
      `
    }
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent
    })
    
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

// utils/auth.js
import jwt from 'jsonwebtoken'

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'samolvic-secret',
    { expiresIn: '24h' }
  )
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'samolvic-secret')
  } catch (error) {
    return null
  }
}
