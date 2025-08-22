#!/bin/bash

# Test script for the updated credit score endpoint
# Run this after starting the server with: npm run start:dev

echo "🧪 Testing Updated Credit Score Endpoint"
echo "========================================="

# Set your admin token here (get from login)
ADMIN_TOKEN="your-admin-token-here"
USER_ID="your-test-user-id-here"

# Test the new endpoint with proper DTO
echo "Testing PATCH /users/${USER_ID}/credit-score"
curl -X PATCH "http://localhost:3000/users/${USER_ID}/credit-score" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "creditScore": 750
  }' \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Test completed!"
echo "Expected: 200 status with updated user object"
echo "Note: Replace ADMIN_TOKEN and USER_ID with actual values"
