# Stripe Payment Integration Setup Guide

## Overview
This guide will help you set up Stripe payments for Sway's Pro ($9/month) and Business ($29/month) subscription plans.

## Step 1: Create a Stripe Account

1. Go to https://stripe.com and sign up for a free account
2. Complete the registration process
3. You'll start in **Test Mode** (recommended for development)

## Step 2: Get Your API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Click "Reveal test key" and copy your **Secret key** (starts with `sk_test_`)
4. Update your `/backend/.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
   ```

## Step 3: Create Products and Prices

### Create Pro Plan ($9/month)
1. Go to https://dashboard.stripe.com/test/products
2. Click "+ Create product"
3. Fill in:
   - **Name**: Sway Pro
   - **Description**: 50 GB storage with unlimited requests
   - **Pricing**: Recurring
   - **Price**: $9.00 USD
   - **Billing period**: Monthly
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`)
6. Update your `.env`:
   ```
   STRIPE_PRO_PRICE_ID=price_YOUR_ACTUAL_PRICE_ID
   ```

### Create Business Plan ($29/month)
1. Click "+ Create product" again
2. Fill in:
   - **Name**: Sway Business
   - **Description**: 200 GB storage with unlimited requests
   - **Pricing**: Recurring
   - **Price**: $29.00 USD
   - **Billing period**: Monthly
3. Click "Save product"
4. Copy the **Price ID** (starts with `price_`)
5. Update your `.env`:
   ```
   STRIPE_BUSINESS_PRICE_ID=price_YOUR_ACTUAL_PRICE_ID
   ```

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your backend when payments succeed or subscriptions are cancelled.

### Using Stripe CLI (Recommended for Development)

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local backend:
   ```bash
   stripe listen --forward-to localhost:5001/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and update `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET
   ```

5. Keep this terminal window open while developing

### For Production

1. Go to https://dashboard.stripe.com/webhooks
2. Click "+ Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy the **Signing secret** and update your production `.env`

## Step 5: Update Environment Variables

Your `/backend/.env` should now look like this:

```env
PORT=5001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sway
DB_PASSWORD=postgres
DB_PORT=5432
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3001
JWT_SECRET=sway_requesting_platform_secret_change_in_production_2024

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_123...
STRIPE_PRO_PRICE_ID=price_1ABC...
STRIPE_BUSINESS_PRICE_ID=price_1XYZ...
```

## Step 6: Restart Your Backend

```bash
cd /Users/wjc2007/Desktop/sway/backend
npm start
```

## Step 7: Test the Integration

### Test Upgrade Flow

1. Login to your Sway app
2. Go to the Plan page
3. Click "Upgrade" on Pro or Business plan
4. Use Stripe's test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
5. Use any future expiration date (e.g., `12/34`)
6. Use any 3-digit CVC (e.g., `123`)
7. Use any ZIP code (e.g., `12345`)

### Verify Webhook Events

In the terminal running `stripe listen`, you should see:
```
→ Ready! Your webhook signing secret is whsec_xxx
✔ Received event: checkout.session.completed
```

### Check Database

```bash
PGPASSWORD=postgres psql -U postgres -d sway -c "SELECT id, email, plan, storage_limit_gb FROM users;"
```

You should see your user's plan updated to 'pro' or 'business'.

## How the Payment Flow Works

### 1. User Clicks "Upgrade"
- Frontend (`Plan.jsx`) calls `/api/stripe/create-checkout-session`
- Backend creates a Stripe Checkout session with the selected plan
- Backend returns the Stripe Checkout URL

### 2. User Completes Payment
- User is redirected to Stripe's hosted checkout page
- User enters card details and completes payment
- Stripe processes the payment

### 3. Webhook Notification
- Stripe sends `checkout.session.completed` event to `/api/stripe/webhook`
- Backend verifies the webhook signature
- Backend updates the user's plan in the database:
  - Sets `plan` to 'pro' or 'business'
  - Stores `stripe_customer_id` and `stripe_subscription_id`
  - Updates `storage_limit_gb` (50 or 200)

### 4. User Returns to Dashboard
- User is redirected back to `/dashboard?session_id=xxx`
- User sees their new plan reflected in the UI

### 5. Subscription Management
- If user cancels subscription in Stripe Dashboard
- Webhook `customer.subscription.deleted` is sent
- Backend automatically downgrades user to 'free' plan

## Testing Scenarios

### Test Successful Upgrade
1. Click "Upgrade" → Pro
2. Use card `4242 4242 4242 4242`
3. Complete checkout
4. Verify plan shows as "Pro" in Dashboard
5. Check database confirms `plan = 'pro'` and `storage_limit_gb = 50`

### Test Failed Payment
1. Click "Upgrade" → Business
2. Use card `4000 0000 0000 0002`
3. Payment should fail
4. User should NOT be upgraded

### Test Subscription Cancellation
1. Go to https://dashboard.stripe.com/test/subscriptions
2. Find the test subscription
3. Click "Cancel subscription"
4. Webhook should downgrade user to 'free'
5. Verify in database: `plan = 'free'` and `storage_limit_gb = 1`

## Switching to Live Mode

When you're ready to accept real payments:

1. Go to https://dashboard.stripe.com/settings
2. Complete Stripe's activation requirements (bank account, business info)
3. Get your **Live** API keys from https://dashboard.stripe.com/apikeys
4. Create your products/prices in **Live mode**
5. Set up production webhook endpoint
6. Update your production `.env` with live keys
7. Switch Stripe Dashboard from "Test mode" to "Live mode"

## Troubleshooting

### Webhook not receiving events
- Make sure `stripe listen` is running
- Check webhook signature verification
- Verify endpoint URL is correct

### Payment succeeds but database not updating
- Check backend logs for errors
- Verify database migration ran (`migrations/003_add_stripe_fields.sql`)
- Check webhook event handler in `routes/stripe.js`

### User plan not showing in frontend
- Make sure `user` object in localStorage includes `plan` field
- Check that login endpoint returns updated user data
- Verify `Plan.jsx` is reading `userData.plan`

## Security Notes

1. **Never commit `.env` file** - Add it to `.gitignore`
2. **Use test keys in development** - Only use live keys in production
3. **Verify webhook signatures** - Always use `stripe.webhooks.constructEvent()`
4. **Use HTTPS in production** - Stripe requires HTTPS for webhooks
5. **Validate on server** - Never trust client-side payment status

## Additional Features to Consider

1. **Proration** - Handle mid-month upgrades/downgrades
2. **Billing Portal** - Let users manage subscriptions via Stripe
3. **Invoice Emails** - Stripe sends these automatically
4. **Failed Payment Recovery** - Handle declined cards
5. **Usage-Based Billing** - Charge for storage overages

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com
- Stripe CLI Docs: https://stripe.com/docs/stripe-cli
- Test Card Numbers: https://stripe.com/docs/testing

---

**You're all set!** The payment integration is now complete. Users can upgrade to Pro or Business plans and Stripe will handle all payment processing, subscription management, and automatic downgrades.
