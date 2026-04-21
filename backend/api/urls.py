from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import *

router = DefaultRouter()

# Auth
router.register(r'register', RegisterViewSet, basename='register')
router.register(r'logout', LogoutViewSet, basename='logout')

# Users
router.register(r'users', UserViewSet)
router.register(r'addresses', UserAddressViewSet)

# Plats
router.register(r'dishes', DishViewSet)
router.register(r'categories', DishCategoryViewSet)

# Personnalisation
router.register(r'custom-dishes', CustomDishViewSet)

# Panier
router.register(r'cart', CartViewSet, basename='cart')

# Commandes
router.register(r'orders', OrderViewSet)

# Paiement
router.register(r'payment', PaymentViewSet, basename='payment')

# Fidélité
router.register(r'loyalty', LoyaltyViewSet, basename='loyalty')

# Meal Prep
router.register(r'meal-plans', MealPlanViewSet)

# Chatbot
router.register(r'chatbot', ChatbotViewSet, basename='chatbot')

# Social
router.register(r'posts', SocialPostViewSet)
router.register(r'challenges', ChallengeViewSet)

# Entreprise
router.register(r'companies', CompanyViewSet)

# FAQ
router.register(r'faq', FAQViewSet, basename='faq')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]