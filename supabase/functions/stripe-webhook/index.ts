import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type'
      } 
    })
  }

  const signature = req.headers.get('stripe-signature')
  const body = await req.text()
  
  // Validate webhook secret is configured
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return new Response('Webhook configuration error', { status: 500 })
  }

  // Create Stripe client once at the top
  const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
  })

  let event
  
  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      signature!,
      webhookSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log('Processing webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.metadata?.supabase_user_id
        
        console.log('Checkout session completed for user:', userId)
        
        if (userId) {
          const subscriptionId = session.subscription
          
          if (subscriptionId) {
            console.log('Retrieving subscription:', subscriptionId)
            const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
            
            console.log('Updating profile to Pro with subscription')
            const { error } = await supabaseClient
              .from('profiles')
              .update({
                plan: 'pro',
                plan_status: 'active',
                stripe_customer_id: session.customer,
                stripe_subscription_id: subscriptionId,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
              
            if (error) {
              console.error('Error updating profile:', error)
              throw error
            }
            console.log('Successfully updated profile to Pro')
          } else {
            console.log('Updating profile to Pro (one-time)')
            const { error } = await supabaseClient
              .from('profiles')
              .update({
                plan: 'pro',
                plan_status: 'active',
                stripe_customer_id: session.customer,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
              
            if (error) {
              console.error('Error updating profile:', error)
              throw error
            }
            console.log('Successfully updated profile to Pro')
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
        
        if (subscriptionId) {
          const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.supabase_user_id
          
          if (userId) {
            await supabaseClient
              .from('profiles')
              .update({
                plan_status: 'active',
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription
        
        if (subscriptionId) {
          const subscription = await stripeClient.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.supabase_user_id
          
          if (userId) {
            await supabaseClient
              .from('profiles')
              .update({
                plan_status: 'past_due',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.supabase_user_id
        
        if (userId) {
          await supabaseClient
            .from('profiles')
            .update({
              plan: 'free',
              plan_status: 'cancelled',
              stripe_subscription_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.supabase_user_id
        
        if (userId) {
          let planStatus = 'active'
          
          // Map Stripe subscription status to our status
          switch (subscription.status) {
            case 'active':
              planStatus = 'active'
              break
            case 'past_due':
              planStatus = 'past_due'
              break
            case 'canceled':
            case 'cancelled':
              planStatus = 'cancelled'
              break
            case 'unpaid':
              planStatus = 'unpaid'
              break
            case 'trialing':
              planStatus = 'trialing'
              break
            default:
              planStatus = subscription.status
          }

          await supabaseClient
            .from('profiles')
            .update({
              plan_status: planStatus,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as any
        const userId = subscription.metadata?.supabase_user_id
        
        if (userId) {
          await supabaseClient
            .from('profiles')
            .update({
              plan: 'pro',
              plan_status: subscription.status,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
})