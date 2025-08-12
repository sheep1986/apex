#!/bin/bash
echo "Starting development server..."
export VITE_USE_NEW_AUTH=true
pnpm dev 2>&1 | tee dev.log