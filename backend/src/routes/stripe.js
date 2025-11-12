const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/pool')
const { createNotification } = require('./notifications')
const rateLimit = require('express-rate-limit')

// Lazy-load Stripe only when needed
let stripe = null
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  }
  return stripe
}

// Rate limiter for Stripe checkout/subscription operations
const stripeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 checkout attempts per 15 minutes
  message: { error: 'Too many checkout attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
})

// Create checkout session for plan upgrade
router.post('/create-checkout-session', authenticateToken, stripeLimiter, async (req, res) => {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const { planId } = req.body

    if (!planId || planId !== 'pro') {
      return res.status(400).json({ error: 'Invalid plan ID' })
    }

    // SwayFiles Pro Plan Price ID from environment
    const priceId = process.env.STRIPE_PRO_PRICE_ID

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/plan`,
      client_reference_id: req.userId.toString(),
      customer_email: req.userEmail,
      metadata: {
        userId: req.userId.toString(),
        planId: 'pro'
      }
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// Webhook to handle successful payments (needs raw body)
router.post('/webhook', async (req, res) => {
  const stripe = getStripe()
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' })
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata.userId

        // Update user's plan in database (Pro plan: 50GB storage, 200 requests)
        await pool.query(
          `UPDATE users
           SET plan = 'pro',
               stripe_customer_id = $1,
               stripe_subscription_id = $2,
               storage_limit_gb = 50
           WHERE id = $3`,
          [session.customer, session.subscription, userId]
        )

        // Create notification for successful upgrade
        await createNotification(
          userId,
          'plan_upgrade',
          'Plan Upgraded Successfully',
          `Your plan has been upgraded to Pro. You now have 50 GB of storage and 200 active requests.`,
          { planId: 'pro', storageLimit: 50 }
        )

        console.log(`User ${userId} upgraded to Pro`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Get user ID before downgrading
        const userResult = await pool.query(
          'SELECT id FROM users WHERE stripe_subscription_id = $1',
          [subscription.id]
        )

        // Downgrade user to free plan when subscription is cancelled
        await pool.query(
          `UPDATE users
           SET plan = 'free',
               stripe_subscription_id = NULL,
               storage_limit_gb = 2
           WHERE stripe_subscription_id = $1`,
          [subscription.id]
        )

        // Create notification for downgrade
        if (userResult.rows.length > 0) {
          await createNotification(
            userResult.rows[0].id,
            'plan_downgrade',
            'Subscription Cancelled',
            `Your subscription has been cancelled and you've been downgraded to the Free plan. You now have 2 GB of storage and 20 active requests.`,
            { planId: 'free', storageLimit: 2 }
          )
        }

        console.log(`Subscription ${subscription.id} cancelled, user downgraded to free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object

        // Get user by Stripe customer ID
        const userResult = await pool.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [invoice.customer]
        )

        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id

          // Create notification for payment failure
          await createNotification(
            userId,
            'payment_failed',
            'Payment Failed',
            `Your recent payment failed. Please update your payment method to avoid service interruption. You can manage your subscription in the Billing page.`,
            { invoiceId: invoice.id, amount: invoice.amount_due }
          )
        }

        console.log(`Payment failed for customer ${invoice.customer}`)
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
})

// Get current plan info
router.get('/plan-info', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT plan, storage_limit_gb, stripe_customer_id FROM users WHERE id = $1',
      [req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Plan info error:', error)
    res.status(500).json({ error: 'Failed to get plan info' })
  }
})

// Cancel subscription
router.post('/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const result = await pool.query(
      'SELECT stripe_subscription_id FROM users WHERE id = $1',
      [req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const subscriptionId = result.rows[0].stripe_subscription_id

    if (!subscriptionId) {
      return res.status(400).json({ error: 'No active subscription' })
    }

    // Cancel the subscription at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    })

    res.json({ message: 'Subscription will be cancelled at the end of the billing period' })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    res.status(500).json({ error: 'Failed to cancel subscription' })
  }
})

// Request refund (cancel immediately and refund)
router.post('/request-refund', authenticateToken, async (req, res) => {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const result = await pool.query(
      'SELECT stripe_subscription_id, stripe_customer_id, created_at FROM users WHERE id = $1',
      [req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { stripe_subscription_id, stripe_customer_id, created_at } = result.rows[0]

    if (!stripe_subscription_id) {
      return res.status(400).json({ error: 'No active subscription' })
    }

    // Get the subscription to find the latest invoice
    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id)

    // Check if subscription is within 30 day refund window
    const subscriptionCreated = new Date(subscription.created * 1000)
    const daysSinceCreation = Math.floor((Date.now() - subscriptionCreated.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceCreation > 30) {
      return res.status(400).json({
        error: 'Refund window expired',
        message: 'Refunds are only available within 30 days of purchase'
      })
    }

    // Get the latest invoice and create a refund
    if (subscription.latest_invoice) {
      const invoice = await stripe.invoices.retrieve(subscription.latest_invoice)

      if (invoice.payment_intent) {
        // Create refund for the payment
        await stripe.refunds.create({
          payment_intent: invoice.payment_intent,
          reason: 'requested_by_customer'
        })
      }
    }

    // Cancel the subscription immediately (not at period end)
    await stripe.subscriptions.cancel(stripe_subscription_id)

    // Update user to free plan
    await pool.query(
      `UPDATE users
       SET plan = 'free',
           stripe_subscription_id = NULL,
           storage_limit_gb = 2
       WHERE id = $1`,
      [req.userId]
    )

    res.json({
      success: true,
      message: 'Refund processed successfully. Your subscription has been cancelled and you have been downgraded to the free plan.'
    })
  } catch (error) {
    console.error('Request refund error:', error)
    res.status(500).json({ error: 'Failed to process refund request' })
  }
})

module.exports = router
