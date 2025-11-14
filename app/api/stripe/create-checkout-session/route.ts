import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import jwt from 'jsonwebtoken'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
  })
}

// Helper function to extract user ID from HttpOnly cookie
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('token')?.value
    if (!token || !process.env.JWT_SECRET) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    return decoded.userId || null
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { priceId, mode, successUrl, cancelUrl } = await request.json()
    const stripe = getStripe()

    // SECURITY FIX: Extract user ID from HttpOnly cookie JWT
    const userId = getUserIdFromToken(request)

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to continue.' },
        { status: 401 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId || process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: mode || 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}