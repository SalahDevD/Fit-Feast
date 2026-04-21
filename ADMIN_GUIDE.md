# FitFeast Admin Dashboard

## Overview
The admin dashboard allows administrators to manage users, dishes, and orders in the FitFeast application.

## Features

### 👥 Users Management
- **View all users**: See a complete list of registered users
- **Add new user**: Create new user accounts directly from the dashboard
- **Edit user**: Update user information (name, email, phone, etc.)
- **Delete user**: Remove user accounts from the system

### 🍽️ Dishes Management
- **View all dishes**: Browse all available and unavailable dishes
- **Add new dish**: Create new menu items with detailed nutritional information
- **Edit dish**: Update dish details (price, description, nutrition values)
- **Delete dish**: Remove dishes from the menu
- **Track nutrition**: Calories, protein, carbs, and fats information

### 📦 Orders Management
- **View all orders**: See all customer orders and their details
- **Update order status**: Change order status between:
  - **Pending** (attente): Order received, awaiting payment
  - **Paid** (payée): Payment processed
  - **Prepared** (préparée): Order is being prepared
- **Order statistics**: Dashboard shows counts of total, paid, and prepared orders

## Access

### For Admins
1. Log in with admin credentials at `/login`
2. Once logged in, you'll see an "⚙️ Admin" link in the header
3. Click it to access the admin dashboard at `/admin`

### Security
- Only users with `is_staff` status can access the admin dashboard
- Non-admin users are automatically redirected to the login page
- All API endpoints require admin authentication

## Creating an Admin User

### Option 1: Using Django Shell
```bash
cd backend/fitfeast_backend
python manage.py shell
```
Then in the shell:
```python
from users.models import User
User.objects.create_superuser('admin', 'admin@fitfeast.com', 'admin123')
```

### Option 2: Using the Provided Script
```bash
cd backend/fitfeast_backend
python create_admin.py
```

### Option 3: Using Django Admin
```bash
python manage.py createsuperuser
```

## Default Admin Credentials (if using create_admin.py)
- **Username**: admin
- **Email**: admin@fitfeast.com
- **Password**: admin123

⚠️ **Important**: Change these credentials in production!

## API Endpoints

### Users Management
- `GET /api/admin/users/` - List all users
- `POST /api/admin/users/` - Create new user
- `PATCH /api/admin/users/{id}/` - Update user
- `DELETE /api/admin/users/{id}/` - Delete user

### Dishes Management
- `GET /api/admin/plats/` - List all dishes (including unavailable)
- `POST /api/admin/plats/` - Create new dish
- `PATCH /api/admin/plats/{id}/` - Update dish
- `DELETE /api/admin/plats/{id}/` - Delete dish

### Orders Management
- `GET /api/admin/commandes/` - List all orders
- `PATCH /api/admin/commandes/{id}/update_status/` - Update order status
  - Accepts: `{"statut": "attente|payee|preparee"}`

## Workflow Examples

### Adding a New Dish
1. Click on "🍽️ Dishes Management" tab
2. Fill in the dish form with:
   - Name (nom)
   - Description
   - Price
   - Nutritional values (calories, protein, carbs, fats)
   - Image URL or emoji
3. Click "Add Dish"

### Managing Orders
1. Click on "📦 Orders Management" tab
2. View all customer orders with:
   - Order ID
   - Customer name
   - Order date
   - Total amount
   - Current status
3. Use the status dropdown to update order progress
4. Statistics dashboard shows order counts

### User Management
1. Click on "👥 Users Management" tab
2. View all registered users
3. Edit user information as needed
4. Remove users who are no longer active

## Database Fields

### User Fields
- id, username, email
- first_name, last_name
- phone, address
- allergies, dietary_preferences
- loyalty_points
- is_staff (admin role), is_employee

### Dish Fields
- id, nom (name)
- description, prix (price)
- calories, proteines, glucides, lipides
- image
- disponible (availability)

### Order Fields
- id, client (user), date_commande
- statut (status)
- total
- lignes (order items)

## Troubleshooting

### "Cannot access admin dashboard"
- Check if you're logged in
- Verify your user account has `is_staff=True`
- Clear browser cache and login again

### "API endpoints returning 403"
- Ensure your token is valid
- Check that the Authorization header is being sent
- Verify the user has admin permissions

### "Dishes not showing"
- Check if dishes exist in the database
- Verify the Django server is running
- Check API endpoints in browser console

## Best Practices

1. **Regular Backups**: Backup your database regularly
2. **Secure Password**: Change default admin password
3. **Monitor Orders**: Check order status regularly
4. **Update Menu**: Keep dishes and prices current
5. **User Management**: Remove inactive accounts periodically
6. **Audit Trail**: Monitor who makes changes to critical data

## Future Enhancements

- [ ] User activity log
- [ ] Dish analytics and sales reports
- [ ] Bulk operations (import/export)
- [ ] Advanced filtering and search
- [ ] Order analytics and BI dashboard
