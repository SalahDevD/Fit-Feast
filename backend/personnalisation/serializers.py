from rest_framework import serializers
from .models import ComponentGroup, ComponentItem, ComponentChoice, CustomDish, CustomDishComponent
from plats.serializers import IngredientSerializer, DishListSerializer

class ComponentItemSerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    # Ensure numeric fields are returned as numbers, not strings
    price_delta = serializers.DecimalField(max_digits=10, decimal_places=2)
    calories_kcal = serializers.IntegerField()
    protein_g = serializers.DecimalField(max_digits=6, decimal_places=2)
    carbs_g = serializers.DecimalField(max_digits=6, decimal_places=2)
    fat_g = serializers.DecimalField(max_digits=6, decimal_places=2)
    
    class Meta:
        model = ComponentItem
        fields = '__all__'

class ComponentChoiceSerializer(serializers.ModelSerializer):
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    # Ensure numeric fields are returned as numbers
    calories = serializers.IntegerField()
    proteins = serializers.DecimalField(max_digits=6, decimal_places=2)
    carbs = serializers.DecimalField(max_digits=6, decimal_places=2)
    fats = serializers.DecimalField(max_digits=6, decimal_places=2)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        model = ComponentChoice
        fields = '__all__'

class ComponentGroupSerializer(serializers.ModelSerializer):
    items = ComponentItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ComponentGroup
        fields = '__all__'

class CustomDishComponentSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source='component_item.name', read_only=True)
    component_details = ComponentItemSerializer(source='component_item', read_only=True)
    
    class Meta:
        model = CustomDishComponent
        fields = ['id', 'component_item', 'component_name', 'component_details', 'quantity']

class CustomDishSerializer(serializers.ModelSerializer):
    components_details = CustomDishComponentSerializer(source='customdishcomponent_set', many=True, read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    base_dish_details = DishListSerializer(source='base_dish', read_only=True)
    # Ensure numeric fields are returned as numbers
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    calories_kcal = serializers.IntegerField()
    protein_g = serializers.DecimalField(max_digits=6, decimal_places=2)
    carbs_g = serializers.DecimalField(max_digits=6, decimal_places=2)
    fat_g = serializers.DecimalField(max_digits=6, decimal_places=2)
    
    class Meta:
        model = CustomDish
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']

class CustomDishCreateSerializer(serializers.Serializer):
    base_dish_id = serializers.IntegerField(required=True)
    title = serializers.CharField(required=False, allow_blank=True)
    components = serializers.ListField(child=serializers.IntegerField())
    
    def validate_components(self, value):
        if not value:
            raise serializers.ValidationError("Au moins un composant est requis")
        return value