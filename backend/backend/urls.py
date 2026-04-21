from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

# Importer tous les viewsets et custom token view
from users.views import UserViewSet, RegisterView, UserAddressViewSet, CustomTokenObtainPairView
from plats.views import DishCategoryViewSet, IngredientViewSet, DishViewSet
from personnalisation.views import ComponentGroupViewSet, ComponentChoiceViewSet, CustomDishViewSet
from panier.views import CartViewSet
from commandes.views import OrderViewSet
from fidelite.views import LoyaltyAccountViewSet, RewardViewSet
from mealprep.views import MealPlanViewSet
from chatbot.views import ChatConversationViewSet, ChatbotViewSet
from paiement.views import PaymentIntentViewSet, InvoiceViewSet
from allergies.views import AllergenViewSet, DietTypeViewSet, UserAllergyViewSet, UserDietViewSet
from social.views import SocialPostViewSet, ChallengeViewSet
from entreprise.views import CompanyViewSet, CompanyGroupOrderViewSet
from faq.views import FAQCategoryViewSet, FAQEntryViewSet

router = DefaultRouter()

# Users
router.register(r'users', UserViewSet)
router.register(r'addresses', UserAddressViewSet)

# Plats
router.register(r'categories', DishCategoryViewSet)
router.register(r'ingredients', IngredientViewSet)
router.register(r'dishes', DishViewSet)

# Personnalisation
router.register(r'component-groups', ComponentGroupViewSet)
router.register(r'component-choices', ComponentChoiceViewSet)
router.register(r'custom-dishes', CustomDishViewSet)

# Panier
router.register(r'cart', CartViewSet, basename='cart')

# Commandes
router.register(r'orders', OrderViewSet)

# Fidélité
router.register(r'loyalty', LoyaltyAccountViewSet, basename='loyalty')
router.register(r'rewards', RewardViewSet)

# Chatbot
router.register(r'chat-conversations', ChatConversationViewSet)
router.register(r'chatbot', ChatbotViewSet, basename='chatbot')

# Paiement
router.register(r'payments', PaymentIntentViewSet)
router.register(r'invoices', InvoiceViewSet)

# Allergies
router.register(r'allergens', AllergenViewSet)
router.register(r'diet-types', DietTypeViewSet)
router.register(r'user-allergies', UserAllergyViewSet)
router.register(r'user-diets', UserDietViewSet)

# Social
router.register(r'posts', SocialPostViewSet)
router.register(r'challenges', ChallengeViewSet)

# Entreprise
router.register(r'companies', CompanyViewSet)
router.register(r'company-orders', CompanyGroupOrderViewSet)

# FAQ
router.register(r'faq-categories', FAQCategoryViewSet)
router.register(r'faq', FAQEntryViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include('mealprep.urls')),  # Include custom meal prep URLs
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)