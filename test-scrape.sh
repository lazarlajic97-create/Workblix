#!/bin/bash

# Test scrape-job function with detailed logging
echo "Testing scrape-job function..."
echo ""

# Get URL from argument or use default
URL="${1:-https://www.stepstone.de/stellenangebote--Software-Engineer-w-m-d-Berlin-f2c2b2}"

echo "Testing URL: $URL"
echo ""

# Make request and show full response
curl -v -X POST https://rrwquzbcqrqxwutwijxc.supabase.co/functions/v1/scrape-job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyd3F1emJjcXJxeHd1dHdpanhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjczNzA3NTksImV4cCI6MjA0Mjk0Njc1OX0.Jz-4Ml7U4s3x05zv8dCITwrLfvr5bT-vRU9JoE8yN-s" \
  -d "{\"url\":\"$URL\"}" \
  2>&1 | grep -E "(< HTTP|success|code|message|jobtitel|arbeitgeber)" || echo "Request failed"

echo ""
echo "Done."
