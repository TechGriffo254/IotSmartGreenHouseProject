#!/bin/bash
# Build script for Koyeb deployment

echo "Installing backend dependencies..."
cd backend
npm install --production
echo "Build completed successfully!"
