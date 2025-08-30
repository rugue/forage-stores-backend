#!/bin/bash

# Test Profile Image Upload Functionality
echo "🖼️  Testing Profile Image Upload System..."

API_URL="http://localhost:3000"
TEST_USER_ID="60f1b0b3c9a8b5c5d8e9f0a1"  # Replace with actual user ID

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Profile Image Upload Test Suite${NC}"
echo "=================================="

# Test 1: Upload profile image
echo -e "\n${BLUE}Test 1: Upload Profile Image${NC}"
echo "Creating test image file..."

# Create a simple test image file (1x1 pixel PNG)
echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x1diTXtComment\x00\x00\x00\x00\x00Created with GIMPW\x81\x0e\x17\x00\x00\x00\fIDATx\x9cc\xf8\x0f\x00\x00\x01\x00\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > test-image.png

# Test upload (requires valid JWT token)
echo "Testing profile image upload..."
echo "curl -X POST \"$API_URL/users/profile/$TEST_USER_ID/image\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -F \"profileImage=@test-image.png\""

echo -e "\n${GREEN}✅ Expected Response:${NC}"
cat << 'EOF'
{
  "profileImageUrl": "/uploads/profiles/60f1b0b3c9a8b5c5d8e9f0a1-1640995200000.png"
}
EOF

# Test 2: Delete profile image
echo -e "\n${BLUE}Test 2: Delete Profile Image${NC}"
echo "curl -X DELETE \"$API_URL/users/profile/$TEST_USER_ID/image\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""

echo -e "\n${GREEN}✅ Expected Response:${NC}"
cat << 'EOF'
{
  "message": "Profile image deleted successfully"
}
EOF

# Test 3: Account deactivation
echo -e "\n${BLUE}Test 3: Account Deactivation${NC}"
echo "curl -X PATCH \"$API_URL/users/$TEST_USER_ID/deactivate\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""

echo -e "\n${GREEN}✅ Expected Response:${NC}"
cat << 'EOF'
{
  "message": "Account deactivated successfully"
}
EOF

# Test 4: Account reactivation
echo -e "\n${BLUE}Test 4: Account Reactivation${NC}"
echo "curl -X PATCH \"$API_URL/users/$TEST_USER_ID/reactivate\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\""

echo -e "\n${GREEN}✅ Expected Response:${NC}"
cat << 'EOF'
{
  "message": "Account reactivated successfully"
}
EOF

# Test 5: Profile update with image URL
echo -e "\n${BLUE}Test 5: Profile Update with Image${NC}"
echo "curl -X PATCH \"$API_URL/users/profile/$TEST_USER_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"name\": \"John Doe Updated\", \"profileImage\": \"/uploads/profiles/user123.jpg\"}'"

# Cleanup
echo -e "\n${BLUE}🧹 Cleanup${NC}"
echo "Removing test image file..."
rm -f test-image.png

echo -e "\n${GREEN}✅ Test setup complete!${NC}"
echo -e "${BLUE}💡 Remember to:${NC}"
echo "1. Replace TEST_USER_ID with a valid user ID"
echo "2. Replace YOUR_JWT_TOKEN with a valid JWT token"
echo "3. Ensure the server is running on port 3000"
echo "4. Check the uploads/profiles directory for uploaded files"

echo -e "\n${BLUE}📁 File Upload Directory Structure:${NC}"
echo "uploads/"
echo "└── profiles/"
echo "    ├── user1-timestamp.jpg"
echo "    ├── user2-timestamp.png"
echo "    └── ..."
