# backend/fitfeast_backend/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import UserList, UserDetail, register, login_view, logout_view, UserListAdmin
from plats.views import PlatViewSet, PlatAdminViewSet, IngredientViewSet, CategorieIngredientViewSet
from commandes.views import CommandeViewSet, CommandeAdminViewSet, LigneCommandeViewSet
from paiement.views import PaiementViewSet
from chatbot.views import ChatbotViewSet

router = DefaultRouter()
router.register(r'plats', PlatViewSet)
router.register(r'ingredients', IngredientViewSet)
router.register(r'categories-ingredients', CategorieIngredientViewSet)
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'lignes-commande', LigneCommandeViewSet, basename='ligncommande')
router.register(r'paiements', PaiementViewSet, basename='paiement')
router.register(r'chatbot', ChatbotViewSet, basename='chatbot')

# Admin routers
admin_router = DefaultRouter()
admin_router.register(r'admin/users', UserListAdmin, basename='admin-users')
admin_router.register(r'admin/plats', PlatAdminViewSet, basename='admin-plats')
admin_router.register(r'admin/commandes', CommandeAdminViewSet, basename='admin-commandes')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/', include(admin_router.urls)),
    path('api/users/', UserList.as_view(), name='user-list'),
    path('api/users/me/', UserDetail.as_view(), name='user-detail'),
    path('api/auth/register/', register, name='register'),
    path('api/auth/login/', login_view, name='login'),
    path('api/auth/logout/', logout_view, name='logout'),
]

