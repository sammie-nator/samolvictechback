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

    const isPasswordValid = await bcryptjs.compare(password, admin.password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

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

router.post('/logout', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Logged out' })
})

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.user.id).select('-password')
    res.json(admin)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/users', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' })
    }

    const { email, password, name, role } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    const existingUser = await AdminUser.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

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
