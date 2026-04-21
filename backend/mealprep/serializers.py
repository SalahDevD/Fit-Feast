from rest_framework import serializers
from .models import MealPlan, MealPlanItem
from plats.serializers import DishListSerializer
from personnalisation.serializers import CustomDishSerializer

class MealPlanItemSerializer(serializers.ModelSerializer):
    dish_details = DishListSerializer(source='dish', read_only=True)
    custom_dish_details = CustomDishSerializer(source='custom_dish', read_only=True)
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    item_name = serializers.SerializerMethodField()
    
    class Meta:
        model = MealPlanItem
        fields = ['id', 'day', 'meal_type', 'meal_type_display', 'dish', 'dish_details', 'custom_dish', 'custom_dish_details', 'item_name', 'notes', 'created_at']
    
    def get_item_name(self, obj):
        if obj.dish:
            return obj.dish.name
        elif obj.custom_dish:
            return obj.custom_dish.title or "Plat personnalisé"
        return "Article"

class MealPlanSerializer(serializers.ModelSerializer):
    items = MealPlanItemSerializer(many=True, read_only=True)
    items_by_day = serializers.SerializerMethodField()
    
    class Meta:
        model = MealPlan
        fields = ['id', 'user', 'week_start_date', 'goal', 'items', 'items_by_day', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_items_by_day(self, obj):
        """Group items by day for easier frontend rendering"""
        items_by_day = {}
        for item in obj.items.all():
            day_str = str(item.day)
            if day_str not in items_by_day:
                items_by_day[day_str] = []
            items_by_day[day_str].append(MealPlanItemSerializer(item).data)
        return items_by_day

class MealPlanCreateSerializer(serializers.Serializer):
    week_start_date = serializers.DateField()
    items = serializers.ListField(child=serializers.DictField())
    
    def validate_items(self, value):
        for item in value:
            # Validate required fields for MealPlanItem
            if not item.get('day'):
                raise serializers.ValidationError("'day' field requis pour chaque item")
            if not item.get('meal_type'):
                raise serializers.ValidationError("'meal_type' field requis for each item")
            # Must have either dish_id or custom_dish_id but not both
            has_dish = item.get('dish_id') is not None
            has_custom = item.get('custom_dish_id') is not None
            if not (has_dish or has_custom):
                raise serializers.ValidationError("'dish_id' ou 'custom_dish_id' requis")
            if has_dish and has_custom:
                raise serializers.ValidationError("Fournir soit 'dish_id' soit 'custom_dish_id', pas les deux")
        return value