#!/bin/bash

# Ziggy Image Upload Script
# Usage: ./upload.sh <file> [api_key]

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000}"

# Check if file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <file> [api_key]"
    echo "Example: $0 screenshot.png zipl_xxxxxxxxxxxxxxxxxxxxx"
    exit 1
fi

FILE="$1"
API_KEY="${2:-$ZIPLINE_API_KEY}"

# Validate file exists
if [ ! -f "$FILE" ]; then
    echo "Error: File '$FILE' not found"
    exit 1
fi

# Check for API key
if [ -z "$API_KEY" ]; then
    echo "Error: API key not provided"
    echo "Set ZIPLINE_API_KEY environment variable or pass as second argument"
    exit 1
fi

echo "Uploading $FILE..."

# Upload file
RESPONSE=$(curl -s -X POST \
    -H "X-Zipline-Key: $API_KEY" \
    -F "file=@$FILE" \
    "$API_URL/api/upload")

# Parse response
URL=$(echo "$RESPONSE" | grep -o '"url":"[^"]*' | cut -d'"' -f4)

if [ -n "$URL" ]; then
    echo "Upload successful!"
    echo "URL: $URL"
    echo "$URL" | pbcopy 2>/dev/null || echo "$URL" | xclip -selection clipboard 2>/dev/null || true
else
    echo "Upload failed"
    echo "Response: $RESPONSE"
    exit 1
fi
