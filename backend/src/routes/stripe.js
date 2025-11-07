const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const pool = require('../db/pool')

// Lazy-load Stripe only when needed
let stripe = null
const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
  }
  return stripe
}

// Create checkout session for plan upgrade
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const stripe = getStripe()
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' })
    }

    const { planId } = req.body

    if (!planId || !['pro', 'business'].includes(planId)) {
      return res.status(400).json({ error: 'Invalid plan ID' })
    }

    // Define price IDs (you'll create these in Stripe Dashboard)
    const prices = {
      pro: process.env.STRIPE_PRO_PRICE_ID,
      business: process.env.STRIPE_BUSINESS_PRICE_ID
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: prices[planId],
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/plan`,
      client_reference_id: req.userId.toString(),
      customer_email: req.userEmail,
      metadata: {
        userId: req.userId.toString(),
        planId: planId
      }
    })

    res.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// Webhook to handle successful payments (needs raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
        const planId = session.metadata.planId

        // Determine storage limit based on plan
        const storageLimit = planId === 'pro' ? 50 : 200

        // Update user's plan in database
        await pool.query(
          `UPDATE users
           SET plan = $1,
               stripe_customer_id = $2,
               stripe_subscription_id = $3,
               storage_limit_gb = $4
           WHERE id = $5`,
          [planId, session.customer, session.subscription, storageLimit, userId]
        )

        console.log(`User ${userId} upgraded to ${planId}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Downgrade user to free plan when subscription is cancelled
        await pool.query(
          `UPDATE users
           SET plan = 'free',
               stripe_subscription_id = NULL,
               storage_limit_gb = 1
           WHERE stripe_subscription_id = $1`,
          [subscription.id]
        )

        console.log(`Subscription ${subscription.id} cancelled, user downgraded to free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log(`Payment failed for customer ${invoice.customer}`)
        // You could send an email notification here
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
           storage_limit_gb = 1
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
