// routes/payments.js
import express from 'express'
import axios from 'axios'
import { Payment, Booking } from '../models.js'

const router = express.Router()

// M-Pesa Daraja Integration
// Get access token
const getDarajaToken = async () => {
  try {
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64')
    
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    )
    
    return response.data.access_token
  } catch (error) {
    throw new Error('Failed to get Daraja token: ' + error.message)
  }
}

// Initiate STK Push
router.post('/mpesa/init', async (req, res) => {
  try {
    const { bookingId, amount, phone } = req.body
    
    if (!bookingId || !amount || !phone) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const token = await getDarajaToken()
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    
    const password = Buffer.from(
      `${process.env.MPESA_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64')
    
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORT_CODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phone,
        PartyB: process.env.MPESA_SHORT_CODE,
        PhoneNumber: phone,
        CallBackURL: `${process.env.API_URL}/api/payments/mpesa/callback`,
        AccountReference: bookingId,
        TransactionDesc: `SAMOLVIC Booking ${bookingId}`
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )
    
    if (response.data.ResponseCode === '0') {
      // Save payment record
      const payment = new Payment({
        bookingId,
        amount,
        currency: 'KES',
        method: 'mpesa',
        status: 'pending',
        mpesaDetails: {
          checkoutRequestId: response.data.CheckoutRequestID
        }
      })
      
      await payment.save()
      
      res.json({
        success: true,
        checkoutRequestId: response.data.CheckoutRequestID,
        message: 'STK push initiated'
      })
    } else {
      res.status(400).json({
        success: false,
        error: response.data.ResponseDescription
      })
    }
  } catch (error) {
    console.error('M-Pesa init error:', error)
    res.status(500).json({ error: error.message })
  }
})

// M-Pesa Callback Handler
router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body
    const stkCallback = Body.stkCallback
    
    console.log('M-Pesa Callback:', stkCallback)
    
    if (stkCallback.ResultCode === 0) {
      // Payment successful
      const callbackMetadata = stkCallback.CallbackMetadata
      const amount = callbackMetadata.Item[0].Value
      const transactionId = callbackMetadata.Item[1].Value
      const receipt = callbackMetadata.Item[2].Value
      
      // Update payment
      const payment = await Payment.findOneAndUpdate(
        { 'mpesaDetails.checkoutRequestId': stkCallback.CheckoutRequestID },
        {
          status: 'completed',
          transactionId: transactionId,
          'mpesaDetails.receiptNumber': receipt,
          'mpesaDetails.resultCode': stkCallback.ResultCode,
          'mpesaDetails.resultDesc': stkCallback.ResultDesc
        },
        { new: true }
      )
      
      // Update booking
      if (payment) {
        await Booking.findByIdAndUpdate(
          payment.bookingId,
          { paymentStatus: 'completed', transactionId }
        )
      }
    } else {
      // Payment failed
      const payment = await Payment.findOneAndUpdate(
        { 'mpesaDetails.checkoutRequestId': stkCallback.CheckoutRequestID },
        {
          status: 'failed',
          'mpesaDetails.resultCode': stkCallback.ResultCode,
          'mpesaDetails.resultDesc': stkCallback.ResultDesc
        },
        { new: true }
      )
      
      if (payment) {
        await Booking.findByIdAndUpdate(
          payment.bookingId,
          { paymentStatus: 'failed' }
        )
      }
    }
    
    // Acknowledge receipt
    res.json({ ResultCode: 0, ResultDesc: 'Received' })
  } catch (error) {
    console.error('Callback error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Check payment status
router.get('/mpesa/status/:checkoutRequestId', async (req, res) => {
  try {
    const payment = await Payment.findOne({
      'mpesaDetails.checkoutRequestId': req.params.checkoutRequestId
    })
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' })
    }
    
    res.json({
      status: payment.status,
      transactionId: payment.transactionId
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Paystack Integration
router.post('/paystack/init', async (req, res) => {
  try {
    const { bookingId, amount, email } = req.body
    
    if (!bookingId || !amount || !email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: email,
        amount: amount * 100, // Paystack uses cents
        metadata: {
          booking_id: bookingId,
          custom_fields: [
            {
              display_name: 'Booking ID',
              variable_name: 'booking_id',
              value: bookingId
            }
          ]
        },
        callback_url: `${process.env.FRONTEND_URL}/payment/paystack/verify`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.data.status) {
      // Save payment record
      const payment = new Payment({
        bookingId,
        amount,
        currency: 'NGN', // Paystack uses NGN, adjust as needed
        method: 'paystack',
        status: 'pending',
        paystackDetails: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: response.data.data.reference
        }
      })
      
      await payment.save()
      
      res.json({
        success: true,
        authorization_url: response.data.data.authorization_url,
        reference: response.data.data.reference
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to initialize payment'
      })
    }
  } catch (error) {
    console.error('Paystack init error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Paystack Verification
router.post('/paystack/verify', async (req, res) => {
  try {
    const { reference } = req.body
    
    if (!reference) {
      return res.status(400).json({ error: 'Reference required' })
    }
    
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
        }
      }
    )
    
    if (response.data.status && response.data.data.status === 'success') {
      const bookingId = response.data.data.metadata.booking_id
      
      // Update payment
      const payment = await Payment.findOneAndUpdate(
        { 'paystackDetails.reference': reference },
        {
          status: 'completed',
          transactionId: response.data.data.reference
        },
        { new: true }
      )
      
      // Update booking
      if (payment) {
        await Booking.findByIdAndUpdate(
          bookingId,
          { paymentStatus: 'completed', transactionId: response.data.data.reference }
        )
      }
      
      res.json({ success: true, message: 'Payment verified' })
    } else {
      // Payment failed
      const payment = await Payment.findOneAndUpdate(
        { 'paystackDetails.reference': reference },
        { status: 'failed' },
        { new: true }
      )
      
      if (payment) {
        await Booking.findByIdAndUpdate(
          payment.bookingId,
          { paymentStatus: 'failed' }
        )
      }
      
      res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      })
    }
  } catch (error) {
    console.error('Paystack verify error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
