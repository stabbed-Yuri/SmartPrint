#!/bin/bash

echo "Starting SmartPrint Development Environment..."
echo

echo "Starting Spring Boot Backend..."
cd src && mvn spring-boot:run &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 10

echo "Starting React Frontend..."
cd ../project && npm run dev &
FRONTEND_PID=$!

echo
echo "Development servers are starting..."
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop both servers..."

# Wait for user to stop
wait

# Cleanup
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null 