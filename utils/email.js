import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

/**
 * Simple email sender. Template is currently just used as a label;
 * body is a plain-text summary of `data`.
 */
export async function sendEmail({ to, subject, template, data = {} }) {
  if (!to) {
    console.warn('sendEmail: no recipient, skipping')
    return
  }

  // Skip real send if credentials are not configured (common on first deploy)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log(`[email skipped] to=${to} subject=${subject} template=${template}`, data)
    return { skipped: true }
  }

  const text = [
    `Template: ${template || 'none'}`,
    ...Object.entries(data).map(([k, v]) => `${k}: ${v}`)
  ].join('\n')

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  })

  return info
}
