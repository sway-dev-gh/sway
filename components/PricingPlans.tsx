'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createCheckoutSession } from '@/lib/stripe'

interface PricingPlan {
  name: string
  price: string
  period: string
  features: string[]
  buttonText: string
  popular?: boolean
  current?: boolean
}

const plans: PricingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Up to 3 active projects',
      'Basic collaboration tools',
      '5GB storage per project',
      'Community support',
      'Basic review workflows',
      '10 requests per month'
    ],
    buttonText: 'Current Plan',
    current: true
  },
  {
    name: 'Pro',
    price: '$15',
    period: 'per month',
    features: [
      'Unlimited projects',
      'Advanced collaboration tools',
      '100GB storage per project',
      'Priority support',
      'Custom review workflows',
      'Unlimited requests',
      'Advanced analytics',
      'Team management',
      'API access',
      'Custom integrations'
    ],
    buttonText: 'Upgrade to Pro',
    popular: true
  }
]

export default function PricingPlans() {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const currentPlan = user?.plan || 'free'

  const handleUpgrade = async (planName: string) => {
    if (planName === 'Free') return

    setLoading(true)

    try {
      // Redirect to Stripe checkout
      await createCheckoutSession()
    } catch (error) {
      console.error('Stripe checkout error:', error)
      alert('Payment setup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-terminal-bg py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl text-terminal-text font-medium mb-4">
            Choose Your Plan
          </h2>
          <p className="text-terminal-muted text-sm max-w-2xl mx-auto">
            Start free and upgrade when you need more power. All plans include our core collaboration features.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.name.toLowerCase()
            const isPlanAvailable = plan.name === 'Free' || !isCurrentPlan

            return (
              <div
                key={plan.name}
                className={`bg-terminal-surface border rounded-sm p-6 relative ${
                  plan.popular
                    ? 'border-terminal-text'
                    : 'border-terminal-border'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-terminal-text text-terminal-bg px-3 py-1 text-xs font-medium">
                      POPULAR
                    </span>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-terminal-text text-terminal-bg px-3 py-1 text-xs font-medium">
                      CURRENT
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-xl text-terminal-text font-medium mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline">
                    <span className="text-3xl text-terminal-text font-bold">
                      {plan.price}
                    </span>
                    <span className="text-terminal-muted text-sm ml-2">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <span className="text-terminal-text mr-3 mt-1">•</span>
                        <span className="text-terminal-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleUpgrade(plan.name)}
                  disabled={!isPlanAvailable || loading}
                  className={`w-full py-3 px-4 text-sm font-medium transition-colors ${
                    isCurrentPlan
                      ? 'bg-terminal-hover text-terminal-muted cursor-default'
                      : plan.popular
                      ? 'bg-terminal-text text-terminal-bg hover:bg-terminal-muted'
                      : 'border border-terminal-border text-terminal-text hover:bg-terminal-hover'
                  } ${!isPlanAvailable || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading
                    ? 'Processing...'
                    : isCurrentPlan
                    ? 'Current Plan'
                    : plan.buttonText}
                </button>

                {/* Security Note */}
                {plan.name === 'Pro' && (
                  <div className="mt-4 text-xs text-terminal-muted text-center">
                    <p>• Enhanced security features</p>
                    <p>• SOC 2 compliance</p>
                    <p>• Advanced audit logs</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Security Features */}
        <div className="mt-16 bg-terminal-surface border border-terminal-border rounded-sm p-6">
          <h3 className="text-lg text-terminal-text font-medium mb-4 text-center">
            Security & Trust
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-terminal-muted">
            <div className="text-center">
              <div className="font-medium text-terminal-text mb-2">End-to-End Encryption</div>
              <p>All data encrypted in transit and at rest with AES-256</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-terminal-text mb-2">Zero-Trust Architecture</div>
              <p>Multi-factor authentication and session management</p>
            </div>
            <div className="text-center">
              <div className="font-medium text-terminal-text mb-2">Audit Logs</div>
              <p>Complete activity tracking and compliance reporting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}