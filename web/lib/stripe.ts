import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)

export const getStripe = () => stripePromise

// Stripe checkout for Pro plan
export const createCheckoutSession = async () => {
  try {
    const response = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
        mode: 'subscription',
        successUrl: `${window.location.origin}/settings?billing=success`,
        cancelUrl: `${window.location.origin}/settings?billing=cancelled`,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const { sessionId } = await response.json()

    const stripe = await getStripe()
    if (!stripe) {
      throw new Error('Stripe not initialized')
    }

    // Redirect to Stripe checkout
    const { error } = await stripe.redirectToCheckout({ sessionId })

    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Stripe checkout error:', error)
    throw error
  }
}

// Customer portal for managing subscriptions
export const createPortalSession = async () => {
  try {
    const response = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to create portal session')
    }

    const { url } = await response.json()
    window.location.href = url
  } catch (error) {
    console.error('Stripe portal error:', error)
    throw error
  }
}