echo "Installing dependencies for CeylonCompass..."

echo
echo "Installing root dependencies..."
npm install

echo
echo "Installing backend dependencies..."
cd backend
npm install

echo
echo "Installation complete!"
echo
echo "To start the application:"
echo "1. Start backend: cd backend && npm start"
echo "2. Start frontend: cd frontend && npm run dev"