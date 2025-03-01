#!/bin/bash
# Exit on error
set -e

# Install root dependencies
npm ci

# Build client
cd client
npm ci
CI=false npm run build
cd .. 