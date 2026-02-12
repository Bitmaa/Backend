#!/bin/bash

# =========================
# Phase 3 Admin Test Script (Auto token)
# =========================

# Admin credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Admin123!"

# 1️⃣ Login and get token
echo "Logging in as admin..."
ADMIN_TOKEN=$(curl -s -X POST http://127.0.0.1:9000/api/auth/login \
-H "Content-Type: application/json" \
-d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" | jq -r '.token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token. Check credentials or server."
  exit 1
fi

echo "✅ Got admin token!"

# 2️⃣ Test GET all users
echo "-----------------------------------"
echo "1️⃣ GET all users"
curl -s -X GET http://127.0.0.1:9000/api/admin/users \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-H "Content-Type: application/json" | jq

# 3️⃣ Test GET all media
echo ""
echo "-----------------------------------"
echo "2️⃣ GET all media"
curl -s -X GET http://127.0.0.1:9000/api/admin/media \
-H "Authorization: Bearer $ADMIN_TOKEN" \
-H "Content-Type: application/json" | jq

echo ""
echo "-----------------------------------"
echo "✅ Phase 3 Admin test script executed"
