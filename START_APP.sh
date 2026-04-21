#!/bin/bash
# Quick Start Guide - Fit Feast Application

echo "=========================================="
echo "Fit Feast - Starting Application"
echo "=========================================="
echo ""

# Start Backend
echo "[1/2] Starting Django Backend Server..."
echo "Command: python manage.py runserver 0.0.0.0:8000"
echo "URL: http://localhost:8000/api"
echo ""

# Start Frontend  
echo "[2/2] Starting React Frontend..."
echo "Command: npm start"
echo "URL: http://localhost:3000"
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Available Endpoints:"
echo "  Public:"
echo "    GET  /api/plats/                    - List dishes"
echo "    GET  /api/ingredients/              - List ingredients"
echo ""
echo "  Auth Required:"
echo "    POST /api/auth/register/            - Create account"
echo "    POST /api/auth/login/               - Login (returns token)"
echo "    GET  /api/users/me/                 - Get profile"
echo "    POST /api/auth/logout/              - Logout"
echo "    GET  /api/commandes/                - View orders"
echo ""
echo "Database: MySQL (fitfeast)"
echo "Backend: Django REST Framework"
echo "Frontend: React"
echo "Authentication: Token-based"
