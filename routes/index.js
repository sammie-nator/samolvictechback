// routes/inquiries.js
import express from 'express'
import { Inquiry } from '../models.js'
import { sendEmail } from '../utils/email.js'

const router = express.Router()

// Create inquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, company, message } = req.body
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const inquiry = new Inquiry({
      name,
      email,
      company,
      message
    })
    
    await inquiry.save()
    
    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'We received your inquiry - SAMOLVIC',
      template: 'inquiry-confirmation',
      data: { name }
    })
    
    // Send admin notification
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New inquiry from ${name}`,
      template: 'admin-inquiry-notification',
      data: { name, email, company, message }
    })
    
    res.status(201).json({
      success: true,
      id: inquiry._id
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all inquiries (admin)
router.get('/', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 })
    res.json(inquiries)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single inquiry
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
    if (!inquiry) return res.status(404).json({ error: 'Not found' })
    res.json(inquiry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update inquiry status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    )
    res.json(inquiry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete inquiry
router.delete('/:id', async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router

// routes/bookings.js
import express from 'express'
import { Booking } from '../models.js'
import { sendEmail } from '../utils/email.js'

const routerBookings = express.Router()

// Create booking
routerBookings.post('/', async (req, res) => {
  try {
    const { name, email, company, phone, serviceType, projectDescription, timeline, date, time, paymentMethod } = req.body
    
    if (!name || !email || !company || !serviceType || !projectDescription) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const booking = new Booking({
      name,
      email,
      company,
      phone,
      serviceType,
      projectDescription,
      timeline,
      date,
      time,
      paymentMethod,
      status: 'pending'
    })
    
    await booking.save()
    
    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'Booking received - Complete your payment - SAMOLVIC',
      template: 'booking-confirmation',
      data: { name, bookingId: booking._id }
    })
    
    // Send admin notification
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New booking from ${name}`,
      template: 'admin-booking-notification',
      data: { name, email, company, serviceType, date, time }
    })
    
    res.status(201).json({
      success: true,
      id: booking._id,
      booking
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all bookings (admin)
routerBookings.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single booking
routerBookings.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update booking
routerBookings.patch('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    )
    res.json(booking)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete booking
routerBookings.delete('/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default routerBookings
