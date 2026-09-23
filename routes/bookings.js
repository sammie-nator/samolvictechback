import express from 'express'
import { Booking } from '../models.js'
import { sendEmail } from '../utils/email.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const {
      name, email, company, phone, serviceType,
      projectDescription, timeline, date, time, paymentMethod
    } = req.body

    if (!name || !email || !company || !serviceType || !projectDescription) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const booking = new Booking({
      name, email, company, phone, serviceType,
      projectDescription, timeline, date, time, paymentMethod,
      status: 'pending'
    })
    await booking.save()

    await sendEmail({
      to: email,
      subject: 'Booking received - Complete your payment - SAMOLVIC',
      template: 'booking-confirmation',
      data: { name, bookingId: booking._id }
    })

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New booking from ${name}`,
      template: 'admin-booking-notification',
      data: { name, email, company, serviceType, date, time }
    })

    res.status(201).json({ success: true, id: booking._id, booking })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 })
    res.json(bookings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ error: 'Not found' })
    res.json(booking)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
