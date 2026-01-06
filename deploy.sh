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

# Parse command-line arguments
BUILD_FRONTEND=false
BUILD_ADMIN=false
BUILD_BACKEND=false
SKIP_GIT_PULL=false
AUTO_DETECT=false

# If no arguments provided, enable auto-detection
if [ $# -eq 0 ]; then
    AUTO_DETECT=true
fi

# Parse flags
while [[ $# -gt 0 ]]; do
    case $1 in
        --frontend)
            BUILD_FRONTEND=true
            shift
            ;;
        --admin)
            BUILD_ADMIN=true
            shift
            ;;
        --backend)
            BUILD_BACKEND=true
            shift
            ;;
        --all)
            BUILD_FRONTEND=true
            BUILD_ADMIN=true
            BUILD_BACKEND=true
            shift
            ;;
        --no-pull)
            SKIP_GIT_PULL=true
            shift
            ;;
        --help|-h)
            echo "Usage: ./deploy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --frontend      Build only frontend"
            echo "  --admin         Build only admin"
            echo "  --backend       Build only backend"
            echo "  --all           Build all applications (default)"
            echo "  --no-pull       Skip git pull step"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./deploy.sh                  # Build all apps"
            echo "  ./deploy.sh --frontend       # Build only frontend"
            echo "  ./deploy.sh --frontend --admin  # Build frontend and admin"
            echo "  ./deploy.sh --backend --no-pull # Build backend without git pull"
            exit 0
            ;;
        *)
            print_message "$RED" "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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
print_message "$YELLOW" "Building: $([ "$BUILD_FRONTEND" = true ] && echo -n "Frontend ")$([ "$BUILD_ADMIN" = true ] && echo -n "Admin ")$([ "$BUILD_BACKEND" = true ] && echo -n "Backend")"
echo ""

# Step 1: Git Pull (skip if --no-pull flag is set)
if [ "$SKIP_GIT_PULL" = false ]; then
    print_section "Step 1: Pulling Latest Code from Git"
    
    # Store current HEAD before pulling
    OLD_HEAD=$(git rev-parse HEAD 2>/dev/null)
    
    git fetch origin || handle_error "Git fetch failed"
    git pull origin "$GIT_BRANCH" || handle_error "Git pull failed"
    
    # Get new HEAD after pulling
    NEW_HEAD=$(git rev-parse HEAD 2>/dev/null)
    
    print_message "$GREEN" "✓ Successfully pulled latest code"
    
    # Auto-detect changes if no flags were provided
    if [ "$AUTO_DETECT" = true ]; then
        print_message "$YELLOW" "🔍 Analyzing changes to determine which apps to build..."
        
        # Check if there were any changes
        if [ "$OLD_HEAD" != "$NEW_HEAD" ]; then
            # Get list of changed files
            CHANGED_FILES=$(git diff --name-only "$OLD_HEAD" "$NEW_HEAD" 2>/dev/null)
            
            if [ -n "$CHANGED_FILES" ]; then
                # Check which directories were affected
                if echo "$CHANGED_FILES" | grep -q "^$FRONTEND_DIR/"; then
                    BUILD_FRONTEND=true
                    print_message "$BLUE" "  → Frontend changes detected"
                fi
                
                if echo "$CHANGED_FILES" | grep -q "^$ADMIN_DIR/"; then
                    BUILD_ADMIN=true
                    print_message "$BLUE" "  → Admin changes detected"
                fi
                
                if echo "$CHANGED_FILES" | grep -q "^$BACKEND_DIR/"; then
                    BUILD_BACKEND=true
                    print_message "$BLUE" "  → Backend changes detected"
                fi
                
                # Check for root-level changes that might affect all apps
                if echo "$CHANGED_FILES" | grep -q -E "^(package\.json|\.env|\.gitignore|README\.md|deploy\.sh)$"; then
                    print_message "$BLUE" "  → Root-level changes detected (may affect all apps)"
                    # Don't auto-build all on root changes, let user decide
                fi
                
                # If no app-specific changes detected, build all as fallback
                if [ "$BUILD_FRONTEND" = false ] && [ "$BUILD_ADMIN" = false ] && [ "$BUILD_BACKEND" = false ]; then
                    print_message "$YELLOW" "  → No app-specific changes detected, building all apps"
                    BUILD_FRONTEND=true
                    BUILD_ADMIN=true
                    BUILD_BACKEND=true
                fi
            else
                print_message "$YELLOW" "  → No file changes detected"
            fi
        else
            print_message "$YELLOW" "  → Already up to date, no changes to build"
        fi
    fi
else
    print_message "$YELLOW" "⊘ Skipping git pull (--no-pull flag set)"
    
    # If auto-detect is enabled but git pull is skipped, build all as fallback
    if [ "$AUTO_DETECT" = true ]; then
        print_message "$YELLOW" "  → Auto-detection requires git pull, building all apps"
        BUILD_FRONTEND=true
        BUILD_ADMIN=true
        BUILD_BACKEND=true
    fi
fi

# Step 2: Build Backend
if [ "$BUILD_BACKEND" = true ]; then
    print_section "Building Backend"
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
else
    print_message "$YELLOW" "⊘ Skipping backend build"
fi

# Step 3: Build Frontend
if [ "$BUILD_FRONTEND" = true ]; then
    print_section "Building Frontend"
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
else
    print_message "$YELLOW" "⊘ Skipping frontend build"
fi

# Step 4: Build Admin
if [ "$BUILD_ADMIN" = true ]; then
    print_section "Building Admin"
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
else
    print_message "$YELLOW" "⊘ Skipping admin build"
fi

# Return to project root
cd "$PROJECT_ROOT" || handle_error "Failed to return to project root"

# Step 5: Summary
print_section "Deployment Summary"
if [ "$SKIP_GIT_PULL" = false ]; then
    print_message "$GREEN" "✓ Git pull completed"
fi
if [ "$BUILD_BACKEND" = true ]; then
    print_message "$GREEN" "✓ Backend built successfully"
fi
if [ "$BUILD_FRONTEND" = true ]; then
    print_message "$GREEN" "✓ Frontend built successfully"
fi
if [ "$BUILD_ADMIN" = true ]; then
    print_message "$GREEN" "✓ Admin built successfully"
fi
echo ""
print_message "$GREEN" "🎉 Build process completed successfully!"
if [ "$BUILD_FRONTEND" = true ] || [ "$BUILD_ADMIN" = true ] || [ "$BUILD_BACKEND" = true ]; then
    print_message "$YELLOW" "Note: Remember to restart your services if they are running"
fi
echo ""
