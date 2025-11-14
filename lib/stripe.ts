import { loadStripe } from '@stripe/stripe-js'
import { apiRequest } from './auth'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export const getStripe = () => stripePromise

// Stripe checkout for Pro plan
export const createCheckoutSession = async () => {
  try {
    const response = await apiRequest('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({
        planId: 'pro'
      })
    })

    if (!response?.ok) {
      throw new Error('Failed to create checkout session')
    }

    const data = await response.json()

    if (!data?.url) {
      throw new Error('No checkout URL returned')
    }

    // Redirect to Stripe checkout
    window.location.href = data.url
  } catch (error) {
    console.error('Stripe checkout error:', error)
    throw error
  }
}

// Customer portal for managing subscriptions
export const createPortalSession = async () => {
  try {
    const response = await apiRequest('/api/stripe/create-portal-session', {
      method: 'POST'
    })

    if (!response?.ok) {
      throw new Error('Failed to create portal session')
    }

    const data = await response.json()

    if (!data?.url) {
      throw new Error('No portal URL returned')
    }

    window.location.href = data.url
  } catch (error) {
    console.error('Stripe portal error:', error)
    throw error
  }
}