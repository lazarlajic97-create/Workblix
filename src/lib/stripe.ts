import { loadStripe } from '@stripe/stripe-js';

// Ensure the publishable key is available
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('Stripe publishable key is not configured');
}

// Initialize Stripe.js with the publishable key
export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

/**
 * Creates a Stripe Checkout session via Supabase Edge Function
 */
export const createCheckoutSession = async (
  userId: string,
  email: string,
  accessToken: string
): Promise<{ url: string } | { error: string }> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          userId,
          email,
          successUrl: `${window.location.origin}/pro-success`,
          cancelUrl: `${window.location.origin}/pro-upgrade`,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create checkout session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to create checkout session' 
    };
  }
};

/**
 * Creates a Stripe Customer Portal session via Supabase Edge Function
 */
export const createPortalSession = async (
  customerId: string,
  accessToken: string
): Promise<{ url: string } | { error: string }> => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          customerId,
          returnUrl: window.location.href,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create portal session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating portal session:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to create portal session' 
    };
  }
};
