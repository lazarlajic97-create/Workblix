import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authentication token')
    }

    const { userId, confirmDelete } = await req.json()

    // Verify the user is deleting their own account
    if (user.id !== userId) {
      throw new Error('Unauthorized: Cannot delete another user\'s account')
    }

    if (!confirmDelete) {
      throw new Error('Delete confirmation required')
    }

    console.log(`Processing account deletion for user: ${userId}`)

    // Start transaction - Delete user data in correct order to respect foreign key constraints
    
    // 1. Delete usage_scans records
    const { error: usageError } = await supabaseClient
      .from('usage_scans')
      .delete()
      .eq('user_id', userId)
    
    if (usageError) {
      console.error('Error deleting usage_scans:', usageError)
    }

    // 2. Delete applications
    const { error: appsError } = await supabaseClient
      .from('applications')
      .delete()
      .eq('user_id', userId)
    
    if (appsError) {
      console.error('Error deleting applications:', appsError)
    }

    // 3. Delete cvs
    const { error: cvsError } = await supabaseClient
      .from('cvs')
      .delete()
      .eq('user_id', userId)
    
    if (cvsError) {
      console.error('Error deleting cvs:', cvsError)
    }

    // 4. Delete user files from storage (if any)
    try {
      const { data: files } = await supabaseClient
        .storage
        .from('user-files')
        .list(userId)
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${userId}/${file.name}`)
        await supabaseClient
          .storage
          .from('user-files')
          .remove(filePaths)
      }
    } catch (storageError) {
      console.error('Error deleting user files:', storageError)
    }

    // 5. Cancel any active Stripe subscriptions
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', userId)
      .single()

    if (profile?.stripe_subscription_id) {
      try {
        const stripe = await import('https://esm.sh/stripe@14.21.0?target=deno')
        const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
          apiVersion: '2023-10-16',
          httpClient: stripe.createFetchHttpClient(),
        })

        // Cancel the subscription immediately
        await stripeClient.subscriptions.cancel(profile.stripe_subscription_id)
        console.log(`Cancelled Stripe subscription: ${profile.stripe_subscription_id}`)
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError)
        // Continue with deletion even if Stripe cancellation fails
      }
    }

    // 6. Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('user_id', userId)
    
    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw new Error('Failed to delete profile data')
    }

    // 7. Finally, delete the auth user (this will cascade to related auth tables)
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('Error deleting auth user:', authError)
      throw new Error('Failed to delete user account')
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account successfully deleted' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in delete-account function:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to delete account' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
