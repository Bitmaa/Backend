#!/bin/bash

# -------------------------
# Config
API_URL="http://localhost:3000"
EMAIL="test@example.com"
PASSWORD="123456"
UPLOAD_DIR="$HOME/storage/shared/Pictures"
DOWNLOADED_DIR="$HOME/myMVP/backend/downloaded_feed"
TRACK_FILE="$HOME/myMVP/backend/.mvp_uploaded.txt"

mkdir -p "$DOWNLOADED_DIR"
touch "$TRACK_FILE"

# -------------------------
# Step 1: Login
echo "Logging in..."
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed. Check credentials."
  exit 1
fi
echo "✅ Logged in. Token acquired."

# -------------------------
# Step 2: Upload new images
for file in "$UPLOAD_DIR"/*; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")

  # Skip already uploaded images
  if grep -Fxq "$filename" "$TRACK_FILE"; then
    echo "$filename already uploaded, skipping."
    continue
  fi

  echo "Uploading image: $file"
  RESPONSE=$(curl -s -X POST "$API_URL/api/images/upload" \
    -H "Authorization: Bearer $TOKEN" \
    -F "image=@$file" \
    -F "caption=Uploaded via MVP script")

  echo "Upload response: $RESPONSE"

  # Save uploaded filename to track file
  echo "$filename" >> "$TRACK_FILE"
done

# -------------------------
# Step 3: Fetch feed
echo "Fetching feed..."
FEED_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/images/feed")

echo "Feed images:"
echo "$FEED_RESPONSE" | jq -r '.[] | "ID: \(.user)\nFile: \(.file)\nCaption: \(.caption)\nLikes: \(.likes | length)\n---"'

# -------------------------
# Step 4: Download feed images
echo "Downloading feed images..."
mkdir -p "$DOWNLOADED_DIR"

echo "$FEED_RESPONSE" | jq -c '.[]' | while read IMAGE; do
    FILE=$(echo "$IMAGE" | jq -r '.file')
    CAPTION=$(echo "$IMAGE" | jq -r '.caption')
    USER=$(echo "$IMAGE" | jq -r '.user')

    [ -z "$FILE" ] && continue
    DEST="$DOWNLOADED_DIR/$FILE"

    if [ ! -f "$DEST" ]; then
        curl -s -o "$DEST" "$API_URL/uploads/$FILE"
        echo "Downloaded $FILE from $USER with caption: $CAPTION"
    else
        echo "$FILE already downloaded, skipping."
    fi
done

# -------------------------
# Step 5: Like all images in feed
echo "Liking all images in feed..."
echo "$FEED_RESPONSE" | jq -r '.[]._id' | while read IMAGE_ID; do
    [ -z "$IMAGE_ID" ] && continue
    LIKE_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $TOKEN" "$API_URL/api/images/$IMAGE_ID/like")
    echo "Liked image $IMAGE_ID: $LIKE_RESPONSE"
done

echo "✅ Done. All new images uploaded, feed downloaded, and images liked."


#Step 6 → Comment on all images
# -------------------------
# Step 6: Comment on all images in feed
echo "Commenting on all images in feed..."

echo "$FEED_RESPONSE" | jq -r '.[]._id' | while read IMAGE_ID; do
    [ -z "$IMAGE_ID" ] && continue

    COMMENT_TEXT="Nice upload 🔥"

    COMMENT_RESPONSE=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{\"text\":\"$COMMENT_TEXT\"}" \
      "$API_URL/api/images/$IMAGE_ID/comment")

    echo "Commented on image $IMAGE_ID: $COMMENT_RESPONSE"
done
