# Workblix - Professional Job Application Platform

## Project info

**URL**: https://lovable.dev/projects/fd27d629-4463-40e8-8ccb-a97f96c347d4

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/fd27d629-4463-40e8-8ccb-a97f96c347d4) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.


- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## Stripe Integration Setup

### Prerequisites

1. **Stripe Account**: Create an account at [stripe.com](https://stripe.com)
2. **Supabase Project**: Ensure your Supabase project is set up

### Local Development Setup

#### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (using scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases/latest
```

#### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Update the following in `.env.local`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

#### 3. Set Supabase Edge Function Secrets

In your Supabase Dashboard:
1. Go to Edge Functions → Secrets
2. Add the following secrets:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_test_...)
   - `STRIPE_WEBHOOK_SECRET`: Your webhook signing secret (whsec_...)

#### 4. Deploy Edge Functions

```bash
# Deploy all edge functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session
supabase functions deploy delete-account
```

#### 5. Configure Stripe Webhook

1. Start Stripe CLI webhook forwarding:
```bash
stripe listen --forward-to https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook
```

2. Copy the webhook signing secret displayed in the terminal
3. Update `STRIPE_WEBHOOK_SECRET` in Supabase Edge Functions secrets

### Production Deployment (Vercel)

#### 1. Configure Vercel Environment Variables

In your Vercel project settings, add:
- `VITE_STRIPE_PUBLISHABLE_KEY`: Your live Stripe publishable key (pk_live_...)
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
- `VITE_APP_URL`: Your production domain (e.g., https://workblix.de)

#### 2. Configure Supabase Production Secrets

In Supabase Dashboard (Production):
- `STRIPE_SECRET_KEY`: Your live Stripe secret key (sk_live_...)
- `STRIPE_WEBHOOK_SECRET`: Your production webhook signing secret

#### 3. Set Up Production Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret and update Supabase Edge Functions

### Testing Stripe Integration

#### Test Cards

Use these test card numbers in development:
- **Success**: 4242 4242 4242 4242
- **Requires authentication**: 4000 0025 0000 3155
- **Declined**: 4000 0000 0000 9995

#### Verify Integration

1. **Test Checkout**: Click "Upgrade to Premium" and complete checkout
2. **Check Webhook**: Verify webhook events in Stripe Dashboard
3. **Verify Database**: Check `profiles` table for updated subscription status
4. **Test Portal**: Premium users can manage subscription
5. **Test Deletion**: Users can delete their account (cancels subscription)

### Security Checklist

- [ ] Never commit secret keys to git
- [ ] Use test keys in development
- [ ] Rotate keys regularly
- [ ] Enable webhook signature verification
- [ ] Implement idempotency for webhook handling
- [ ] Set up monitoring for failed payments

### Troubleshooting

**Webhook not receiving events:**
- Check Supabase Edge Function logs
- Verify webhook URL is correct
- Ensure CORS is properly configured

**Payment fails:**
- Check Stripe Dashboard for error details
- Verify API keys are correct
- Check network connectivity

**Subscription status not updating:**
- Verify webhook secret is correct
- Check Edge Function logs for errors
- Ensure database permissions are correct

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/fd27d629-4463-40e8-8ccb-a97f96c347d4) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
