#!/bin/bash
cd "$(dirname "$0")" # Ensure we are in the script's directory

echo "Setting up..."

echo "Installing Backend Dependencies..."
cd backend
npm install
npx playwright install chromium --with-deps

echo "Installing Frontend Dependencies..."
cd ../frontend
npm install

echo "Done! Run ./start-all.sh to launch."
