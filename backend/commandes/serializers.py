from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusEvent
from plats.serializers import DishListSerializer
from personnalisation.serializers import CustomDishSerializer
from users.serializers import UserSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    dish_details = DishListSerializer(source='dish', read_only=True)
    custom_dish_details = CustomDishSerializer(source='custom_dish', read_only=True)
    item_name = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = ['id', 'dish', 'dish_details', 'custom_dish', 'custom_dish_details', 
                  'quantity', 'unit_price', 'item_name', 'total']
    
    def get_item_name(self, obj):
        if obj.dish:
            return obj.dish.name
        elif obj.custom_dish:
            return obj.custom_dish.name or "Plat personnalisé"
        return "Article"
    
    def get_total(self, obj):
        return obj.get_total()

class OrderStatusEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True, allow_null=True)
    
    class Meta:
        model = OrderStatusEvent
        fields = ['id', 'from_status', 'to_status', 'actor', 'actor_name', 'note', 'created_at']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_formatted = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'order_number', 'created_at', 'updated_at']
    
    def get_total_formatted(self, obj):
        return f"{obj.total_amount} €"
    
    def get_grand_total(self, obj):
        """Calcule le total global (subtotal + taxes + frais de livraison)"""
        return obj.subtotal + obj.tax_amount + obj.delivery_fee

class OrderCreateSerializer(serializers.Serializer):
    delivery_address = serializers.CharField(required=True)
    delivery_instructions = serializers.CharField(required=False, allow_blank=True)
    scheduled_time = serializers.DateTimeField(required=False, allow_null=True)

class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)