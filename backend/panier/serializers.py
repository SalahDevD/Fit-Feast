from rest_framework import serializers
from .models import Cart, CartItem
from plats.serializers import DishListSerializer
from personnalisation.serializers import CustomDishSerializer

class CartItemSerializer(serializers.ModelSerializer):
    dish_details = DishListSerializer(source='dish', read_only=True)
    custom_dish_details = CustomDishSerializer(source='custom_dish', read_only=True)
    item_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'dish', 'dish_details', 'custom_dish', 'custom_dish_details', 
                  'quantity', 'unit_price', 'line_total', 'item_name']
    
    def get_item_name(self, obj):
        if obj.dish:
            return obj.dish.name
        elif obj.custom_dish:
            return obj.custom_dish.title or "Plat personnalisé"
        return "Article"

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()
    total_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'status', 'items', 'items_count', 'subtotal', 'total_items', 'total_formatted', 
                  'created_at', 'updated_at']
        read_only_fields = ['user', 'subtotal', 'total_items', 'created_at', 'updated_at']
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_total_formatted(self, obj):
        return f"{obj.subtotal} €"

class AddToCartSerializer(serializers.Serializer):
    dish_id = serializers.IntegerField(required=False, allow_null=True)
    custom_dish_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    def validate(self, data):
        if not data.get('dish_id') and not data.get('custom_dish_id'):
            raise serializers.ValidationError("Spécifiez dish_id ou custom_dish_id")
        return data