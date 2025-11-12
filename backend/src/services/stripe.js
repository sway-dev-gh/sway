const Stripe = require('stripe')

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_KEY_HERE')

// Subscription Plans Configuration
const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: null,
    features: {
      maxWorkspaces: 3,
      maxFiles: 50,
      maxCollaborators: 5,
      storageGB: 1,
      maxFileSizeMB: 10,
      guestLinks: true,
      basicSupport: true
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 1500, // $15.00 in cents
    currency: 'usd',
    interval: 'month',
    stripePriceId: 'price_1SRM4OHh6kpeQiCo8U0xxGT5', // Your real Stripe price ID
    features: {
      maxWorkspaces: -1, // Unlimited
      maxFiles: -1, // Unlimited
      maxCollaborators: -1, // Unlimited
      storageGB: 100,
      maxFileSizeMB: 500,
      guestLinks: true,
      prioritySupport: true,
      advancedCollaboration: true,
      customBranding: true,
      apiAccess: true,
      teamCollaboration: true,
      prioritySupport: true
    }
  }
}

class StripeService {
  constructor() {
    this.stripe = stripe
    this.plans = PLANS
  }

  // Create a new customer
  async createCustomer(email, name, userId) {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString()
        }
      })
      return customer
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      throw error
    }
  }

  // Create a subscription
  async createSubscription(customerId, planId) {
    try {
      const plan = this.plans[planId.toUpperCase()]
      if (!plan || planId === 'FREE') {
        throw new Error('Invalid plan for subscription')
      }

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      })

      return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.del(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      throw error
    }
  }

  // Create payment intent for one-time payments
  async createPaymentIntent(amount, currency = 'usd', customerId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
      })
      return paymentIntent
    } catch (error) {
      console.error('Error creating payment intent:', error)
      throw error
    }
  }

  // Get customer's payment methods
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })
      return paymentMethods
    } catch (error) {
      console.error('Error retrieving payment methods:', error)
      throw error
    }
  }

  // Create billing portal session
  async createBillingPortalSession(customerId, returnUrl) {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })
      return session
    } catch (error) {
      console.error('Error creating billing portal session:', error)
      throw error
    }
  }

  // Verify webhook signature
  constructEvent(payload, signature, endpointSecret) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      )
      return event
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      throw error
    }
  }

  // Get plan details by ID
  getPlan(planId) {
    return this.plans[planId.toUpperCase()] || this.plans.FREE
  }

  // Get all plans
  getAllPlans() {
    return Object.values(this.plans)
  }

  // Check if user has exceeded plan limits
  checkUsageLimits(user, action) {
    const plan = this.getPlan(user.plan || 'FREE')
    const usage = user.usage || {}

    switch (action) {
      case 'create_workspace':
        return usage.workspaces < plan.features.maxWorkspaces || plan.features.maxWorkspaces === -1
      case 'create_file':
        return usage.files < plan.features.maxFiles || plan.features.maxFiles === -1
      case 'add_collaborator':
        return usage.collaborators < plan.features.maxCollaborators || plan.features.maxCollaborators === -1
      case 'upload_file':
        return usage.storageGB < plan.features.storageGB || plan.features.storageGB === -1
      default:
        return true
    }
  }

  // Format price for display
  formatPrice(priceInCents, currency = 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceInCents / 100)
  }
}

module.exports = new StripeService()