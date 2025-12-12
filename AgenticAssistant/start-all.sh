#!/bin/bash
cd "$(dirname "$0")" # Ensure we are in the script's directory

echo "Starting Agentic Web Assistant..."

# Start Backend
cd backend
npm install # Ensure deps are installed
node server.js &
BACKEND_PID=$!

# Start Frontend
cd ../frontend
npm install # Ensure deps are installed
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Application running. Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT

wait
