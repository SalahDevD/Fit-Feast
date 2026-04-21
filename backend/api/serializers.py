from rest_framework import serializers
from django.contrib.auth import get_user_model

# Importer tous tes modèles existants
from users.models import UserAddress
from plats.models import Dish, DishCategory, Ingredient
from commandes.models import Order, OrderItem
from panier.models import Cart, CartItem
from personnalisation.models import CustomDish, ComponentChoice
from fidelite.models import LoyaltyAccount, LoyaltyTransaction
from mealprep.models import MealPlan, MealPlanItem
from paiement.models import PaymentIntent, Invoice
from chatbot.models import ChatConversation, ChatMessage
from social.models import SocialPost, Challenge, ChallengeParticipation
from entreprise.models import Company, CompanyGroupOrder
from faq.models import FAQEntry

User = get_user_model()

# ========== USERS ==========
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'language', 'dark_mode']

class UserAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAddress
        fields = '__all__'
        read_only_fields = ['user']

# ========== PLATS ==========
class DishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = '__all__'

class DishCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = DishCategory
        fields = '__all__'

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

# ========== PERSONNALISATION ==========
class CustomDishSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomDish
        fields = '__all__'
        read_only_fields = ['user', 'calories_calculated', 'proteins_calculated', 'price_calculated']

class ComponentChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComponentChoice
        fields = '__all__'

# ========== PANIER ==========
class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = '__all__'
        read_only_fields = ['cart']

# ========== COMMANDES ==========
class OrderItemSerializer(serializers.ModelSerializer):
    dish_name = serializers.CharField(source='dish.name', read_only=True)
    dish_price = serializers.DecimalField(source='dish.base_price', max_digits=10, decimal_places=2, read_only=True)
    custom_dish_name = serializers.CharField(source='custom_dish.name', read_only=True, allow_null=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'dish', 'dish_name', 'dish_price', 'custom_dish', 'custom_dish_name', 
                  'quantity', 'unit_price', 'line_total']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True, source='items')
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_name', 'status', 'currency',
            'subtotal', 'tax_amount', 'delivery_fee', 'total_amount', 
            'delivery_type', 'recipient_name', 'recipient_phone', 
            'addr_line1', 'addr_line2', 'addr_city', 'addr_region', 
            'addr_postal_code', 'addr_country_code', 'notes', 
            'requested_delivery_at', 'delivered_at', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'user_name', 'created_at', 'updated_at', 
                           'order_number', 'status', 'items']

# ========== FIDÉLITÉ ==========
class LoyaltyAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyAccount
        fields = '__all__'
        read_only_fields = ['user', 'points']

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyTransaction
        fields = '__all__'

# ========== MEAL PREP ==========
class MealPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealPlan
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class MealPlanItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealPlanItem
        fields = '__all__'

# ========== PAIEMENT ==========
class PaymentIntentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentIntent
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

# ========== CHATBOT ==========
class ChatConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatConversation
        fields = '__all__'
        read_only_fields = ['user', 'started_at']

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
        read_only_fields = ['conversation', 'timestamp']

# ========== SOCIAL ==========
# Import ChallengeSerializer and ChallengeParticipationSerializer from social.serializers (more complete)
from social.serializers import SocialPostSerializer, ChallengeSerializer, ChallengeParticipationSerializer

# ========== ENTREPRISE ==========
class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'

class CompanyGroupOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompanyGroupOrder
        fields = '__all__'

# ========== FAQ ==========
class FAQEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQEntry
        fields = '__all__'