const express = require('express')
const router = express.Router()
const stripeService = require('../services/stripe')
const authMiddleware = require('../middleware/authMiddleware')

// GET /api/billing/plans - Get all available plans
router.get('/plans', (req, res) => {
  try {
    const plans = stripeService.getAllPlans()

    // Format plans for frontend consumption
    const formattedPlans = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      formattedPrice: plan.price > 0 ? stripeService.formatPrice(plan.price) : 'Free',
      interval: plan.interval,
      features: plan.features,
      popular: plan.id === 'pro' // Mark Pro as popular
    }))

    res.json({
      success: true,
      plans: formattedPlans
    })
  } catch (error) {
    console.error('Error fetching plans:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch plans'
    })
  }
})

// GET /api/billing/subscription - Get current user's subscription
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const user = req.user

    if (!user.stripeCustomerId || !user.stripeSubscriptionId) {
      return res.json({
        success: true,
        subscription: {
          plan: 'free',
          status: 'active',
          features: stripeService.getPlan('FREE').features
        }
      })
    }

    const subscription = await stripeService.getSubscription(user.stripeSubscriptionId)
    const plan = Object.values(stripeService.plans).find(p =>
      p.stripePriceId === subscription.items.data[0].price.id
    )

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        plan: plan?.id || 'free',
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        features: plan?.features || stripeService.getPlan('FREE').features
      }
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details'
    })
  }
})

// POST /api/billing/subscribe - Subscribe to a plan
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { planId } = req.body
    const user = req.user

    if (!planId || planId === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected'
      })
    }

    const plan = stripeService.getPlan(planId.toUpperCase())
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Plan not found'
      })
    }

    // Create Stripe customer if doesn't exist
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripeService.createCustomer(
        user.email,
        user.name,
        user.id
      )
      customerId = customer.id

      // Update user with Stripe customer ID
      await req.db.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, user.id]
      )
    }

    // Create subscription
    const subscription = await stripeService.createSubscription(customerId, planId)

    // Update user's subscription info
    await req.db.query(
      'UPDATE users SET stripe_subscription_id = $1, plan = $2 WHERE id = $3',
      [subscription.subscriptionId, planId.toLowerCase(), user.id]
    )

    res.json({
      success: true,
      clientSecret: subscription.clientSecret,
      subscriptionId: subscription.subscriptionId
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    })
  }
})

// POST /api/billing/cancel - Cancel subscription
router.post('/cancel', authMiddleware, async (req, res) => {
  try {
    const user = req.user

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found'
      })
    }

    await stripeService.cancelSubscription(user.stripeSubscriptionId)

    // Update user's plan back to free
    await req.db.query(
      'UPDATE users SET stripe_subscription_id = NULL, plan = $1 WHERE id = $2',
      ['free', user.id]
    )

    res.json({
      success: true,
      message: 'Subscription canceled successfully'
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    })
  }
})

// POST /api/billing/portal - Create billing portal session
router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const user = req.user

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No billing account found'
      })
    }

    const session = await stripeService.createBillingPortalSession(
      user.stripeCustomerId,
      `${process.env.FRONTEND_URL || 'http://localhost:3002'}/settings/billing`
    )

    res.json({
      success: true,
      url: session.url
    })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create billing portal session'
    })
  }
})

// GET /api/billing/usage - Get current usage statistics
router.get('/usage', authMiddleware, async (req, res) => {
  try {
    const user = req.user

    // Get workspace count
    const workspacesResult = await req.db.query(
      'SELECT COUNT(*) as count FROM workspaces WHERE owner_id = $1',
      [user.id]
    )

    // Get file count and total storage
    const filesResult = await req.db.query(
      'SELECT COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as total_size FROM files WHERE owner_id = $1',
      [user.id]
    )

    // Get collaborator count (unique users across all workspaces)
    const collaboratorsResult = await req.db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM workspace_collaborators wc
      JOIN workspaces w ON wc.workspace_id = w.id
      WHERE w.owner_id = $1 AND wc.user_id != $1
    `, [user.id])

    const currentPlan = stripeService.getPlan(user.plan || 'FREE')
    const usage = {
      workspaces: parseInt(workspacesResult.rows[0].count),
      files: parseInt(filesResult.rows[0].count),
      collaborators: parseInt(collaboratorsResult.rows[0].count),
      storageGB: Math.round((parseInt(filesResult.rows[0].total_size) / (1024 * 1024 * 1024)) * 100) / 100
    }

    // Calculate percentage usage for each metric
    const usageWithPercentages = {
      workspaces: {
        current: usage.workspaces,
        max: currentPlan.features.maxWorkspaces,
        percentage: currentPlan.features.maxWorkspaces === -1 ? 0 :
          Math.round((usage.workspaces / currentPlan.features.maxWorkspaces) * 100)
      },
      files: {
        current: usage.files,
        max: currentPlan.features.maxFiles,
        percentage: currentPlan.features.maxFiles === -1 ? 0 :
          Math.round((usage.files / currentPlan.features.maxFiles) * 100)
      },
      collaborators: {
        current: usage.collaborators,
        max: currentPlan.features.maxCollaborators,
        percentage: currentPlan.features.maxCollaborators === -1 ? 0 :
          Math.round((usage.collaborators / currentPlan.features.maxCollaborators) * 100)
      },
      storage: {
        current: usage.storageGB,
        max: currentPlan.features.storageGB,
        percentage: currentPlan.features.storageGB === -1 ? 0 :
          Math.round((usage.storageGB / currentPlan.features.storageGB) * 100)
      }
    }

    res.json({
      success: true,
      usage: usageWithPercentages,
      plan: {
        id: user.plan || 'free',
        name: currentPlan.name,
        features: currentPlan.features
      }
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage statistics'
    })
  }
})

// Webhook endpoint for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  try {
    const event = stripeService.constructEvent(req.body, sig, endpointSecret)

    console.log('Received Stripe webhook:', event.type)

    switch (event.type) {
      case 'invoice.payment_succeeded':
        // Update subscription status
        const subscription = event.data.object.subscription
        await req.db.query(
          'UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2',
          ['active', subscription]
        )
        break

      case 'invoice.payment_failed':
        // Handle payment failure
        const failedSubscription = event.data.object.subscription
        await req.db.query(
          'UPDATE users SET subscription_status = $1 WHERE stripe_subscription_id = $2',
          ['past_due', failedSubscription]
        )
        break

      case 'customer.subscription.deleted':
        // Handle subscription cancellation
        const canceledSubscription = event.data.object
        await req.db.query(
          'UPDATE users SET plan = $1, stripe_subscription_id = NULL, subscription_status = $2 WHERE stripe_subscription_id = $3',
          ['free', 'canceled', canceledSubscription.id]
        )
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({
      success: false,
      message: 'Webhook error'
    })
  }
})

module.exports = router