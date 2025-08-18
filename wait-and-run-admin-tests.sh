#!/bin/bash

# This script will wait for rate limiting to reset before running tests
# Use it if you've been hitting rate limits frequently

echo "🕒 Waiting for rate limiting to reset..."
echo "This will pause for 60 seconds to ensure any rate limiting has expired"
sleep 60

echo "✅ Waiting complete. Running tests now."

# Run the focused admin tests
./run-focused-admin-tests.sh "$@"
