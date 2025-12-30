# Quick setup script for admin testing

# Create admin user via API
echo "Creating admin user..."
curl -X POST http://localhost:5003/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "password": "admin123"
  }'

echo ""
echo "Admin login credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "Access admin dashboard:"
echo "http://localhost/admin/login"
echo ""
echo "Regular login (for testing):"
echo "http://localhost/login"
echo "Use the regular credentials to create test users and generate events for analytics!"