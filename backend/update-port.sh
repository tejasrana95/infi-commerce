#!/bin/bash

# Update PORT in .env file
if [ -f .env ]; then
    # Check if PORT exists in .env
    if grep -q "^PORT=" .env; then
        # Update existing PORT
        sed -i.bak 's/^PORT=.*/PORT=3001/' .env
        echo "✅ Updated PORT to 3001 in .env file"
    else
        # Add PORT if it doesn't exist
        echo "PORT=3001" >> .env
        echo "✅ Added PORT=3001 to .env file"
    fi
    
    # Check if API_URL exists and update it
    if grep -q "^API_URL=" .env; then
        sed -i.bak 's|^API_URL=.*|API_URL=http://localhost:3001|' .env
        echo "✅ Updated API_URL to http://localhost:3001 in .env file"
    else
        echo "API_URL=http://localhost:3001" >> .env
        echo "✅ Added API_URL=http://localhost:3001 to .env file"
    fi
    
    # Clean up backup file
    rm -f .env.bak
    
    echo ""
    echo "🎉 Configuration updated successfully!"
    echo "You can now run: npm run dev"
else
    echo "❌ .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "⚠️  Please update the .env file with your actual configuration values"
    else
        echo "❌ .env.example not found either. Please create a .env file manually."
    fi
fi
