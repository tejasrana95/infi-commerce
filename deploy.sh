#!/bin/bash

##############################################
# Deployment Script for Infi-Commerce
# This script pulls latest code and builds all applications
##############################################

# Configuration - Customize these values as needed
FRONTEND_DIR="frontend"
ADMIN_DIR="admin"
BACKEND_DIR="backend"
GIT_BRANCH="main"  # Change to your default branch if different

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to print section headers
print_section() {
    echo ""
    print_message "$BLUE" "================================================"
    print_message "$BLUE" "$1"
    print_message "$BLUE" "================================================"
}

# Function to handle errors
handle_error() {
    print_message "$RED" "❌ Error: $1"
    exit 1
}

# Get the script directory (project root)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT" || handle_error "Failed to change to project root directory"

print_section "Starting Deployment Process"
print_message "$YELLOW" "Project Root: $PROJECT_ROOT"
print_message "$YELLOW" "Branch: $GIT_BRANCH"
echo ""

# Step 1: Git Pull
print_section "Step 1: Pulling Latest Code from Git"
git fetch origin || handle_error "Git fetch failed"
git pull origin "$GIT_BRANCH" || handle_error "Git pull failed"
print_message "$GREEN" "✓ Successfully pulled latest code"

# Step 2: Build Backend
print_section "Step 2: Building Backend"
if [ -d "$BACKEND_DIR" ]; then
    cd "$PROJECT_ROOT/$BACKEND_DIR" || handle_error "Failed to change to $BACKEND_DIR directory"
    
    print_message "$YELLOW" "Installing dependencies..."
    npm install || handle_error "Backend npm install failed"
    
    print_message "$YELLOW" "Building backend..."
    npm run build || handle_error "Backend build failed"
    
    print_message "$GREEN" "✓ Backend build completed successfully"
else
    handle_error "Backend directory '$BACKEND_DIR' not found"
fi

# Step 3: Build Frontend
print_section "Step 3: Building Frontend"
if [ -d "$PROJECT_ROOT/$FRONTEND_DIR" ]; then
    cd "$PROJECT_ROOT/$FRONTEND_DIR" || handle_error "Failed to change to $FRONTEND_DIR directory"
    
    print_message "$YELLOW" "Installing dependencies..."
    npm install || handle_error "Frontend npm install failed"
    
    print_message "$YELLOW" "Building frontend..."
    npm run build || handle_error "Frontend build failed"
    
    print_message "$GREEN" "✓ Frontend build completed successfully"
else
    handle_error "Frontend directory '$FRONTEND_DIR' not found"
fi

# Step 4: Build Admin
print_section "Step 4: Building Admin"
if [ -d "$PROJECT_ROOT/$ADMIN_DIR" ]; then
    cd "$PROJECT_ROOT/$ADMIN_DIR" || handle_error "Failed to change to $ADMIN_DIR directory"
    
    print_message "$YELLOW" "Installing dependencies..."
    npm install || handle_error "Admin npm install failed"
    
    print_message "$YELLOW" "Building admin..."
    npm run build || handle_error "Admin build failed"
    
    print_message "$GREEN" "✓ Admin build completed successfully"
else
    handle_error "Admin directory '$ADMIN_DIR' not found"
fi

# Return to project root
cd "$PROJECT_ROOT" || handle_error "Failed to return to project root"

# Step 5: Summary
print_section "Deployment Summary"
print_message "$GREEN" "✓ Git pull completed"
print_message "$GREEN" "✓ Backend built successfully"
print_message "$GREEN" "✓ Frontend built successfully"
print_message "$GREEN" "✓ Admin built successfully"
echo ""
print_message "$GREEN" "🎉 All builds completed successfully!"
print_message "$YELLOW" "Note: Remember to restart your services if they are running"
echo ""
