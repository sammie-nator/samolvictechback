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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`[email skipped] to=${to} subject=${subject}`)
      return false
    }

    let htmlContent = ''

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
