#!/bin/bash

APP_NAME="myMVP-backend"
ENTRY="index.js"

echo "Stopping any existing PM2 instances of $APP_NAME..."
pm2 delete $APP_NAME 2>/dev/null

echo "Starting $APP_NAME with PM2..."
pm2 start $ENTRY --name $APP_NAME --watch --update-env --no-daemon

echo "✅ $APP_NAME is now running under PM2."
pm2 status $APP_NAME

