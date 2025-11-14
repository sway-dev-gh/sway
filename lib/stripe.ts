import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
        planId: 'pro'
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }

    const { url } = await response.json()

    if (!url) {
      throw new Error('No checkout URL returned')
    }

    // Redirect to Stripe checkout
    window.location.href = url
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