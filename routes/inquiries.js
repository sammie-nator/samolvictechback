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

    const inquiry = new Inquiry({ name, email, company, message })
    await inquiry.save()

    await sendEmail({
      to: email,
      subject: 'We received your inquiry - SAMOLVIC',
      template: 'inquiry-confirmation',
      data: { name }
    })

    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New inquiry from ${name}`,
      template: 'admin-inquiry-notification',
      data: { name, email, company, message }
    })

    res.status(201).json({ success: true, id: inquiry._id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 })
    res.json(inquiries)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
    if (!inquiry) return res.status(404).json({ error: 'Not found' })
    res.json(inquiry)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

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

router.delete('/:id', async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
