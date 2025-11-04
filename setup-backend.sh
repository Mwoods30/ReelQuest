#!/bin/bash

echo "🎣 ReelQuest Full-Stack Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if MongoDB is available
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found in PATH"
    echo "   Install MongoDB Community Edition:"
    echo "   - macOS: brew install mongodb/brew/mongodb-community"  
    echo "   - Ubuntu: sudo apt install mongodb"
    echo "   - Or use MongoDB Atlas (cloud): https://cloud.mongodb.com/"
else
    echo "✅ MongoDB found: $(mongod --version | head -n1)"
fi

echo ""
echo "🔧 Setting up Backend..."
cd backend

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "📄 .env file already exists"
fi

# Generate JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Update .env file with generated JWT secret
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
else
    # Linux
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
fi

echo "✅ JWT secret generated and added to .env"

cd ..

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Update backend/.env with your MongoDB connection string"
echo "2. Start MongoDB (if using local): brew services start mongodb/brew/mongodb-community"
echo "3. Start the backend: cd backend && npm run dev"
echo "4. Start the frontend: npm run dev"
echo ""
echo "🌐 URLs:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:5000"
echo "- API Health Check: http://localhost:5000/api/health"
echo ""
echo "📚 Documentation:"
echo "- Backend README: backend/README.md"
echo "- API Endpoints: See backend/README.md for full list"
echo ""
echo "🎣 Happy Coding!"