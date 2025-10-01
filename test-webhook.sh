#!/bin/bash

# Test script to verify webhook can update the database
# This simulates what Stripe webhook does

echo "Testing webhook database update..."

# You need to replace these with your actual values:
USER_ID="your-user-id-here"  # Get this from Supabase Auth users table
SUPABASE_URL="https://rrwquzbcqrqxwutwijxc.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key-here"  # Get from Supabase Settings > API

curl -X PATCH \
  "${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${USER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "plan": "pro",
    "plan_status": "active",
    "updated_at": "2025-09-30T17:00:00Z"
  }'

echo ""
echo "Check if the profile was updated in Supabase Dashboard > Table Editor > profiles"
