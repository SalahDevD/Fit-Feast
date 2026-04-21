from rest_framework import serializers
from .models import DishCategory, Ingredient, Dish, DishIngredient

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = '__all__'

class DishCategorySerializer(serializers.ModelSerializer):
    dishes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = DishCategory
        fields = '__all__'
    
    def get_dishes_count(self, obj):
        return obj.dishes.filter(is_available=True).count()

class DishIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source='ingredient.name', read_only=True)
    ingredient_details = IngredientSerializer(source='ingredient', read_only=True)
    
    class Meta:
        model = DishIngredient
        fields = ['id', 'ingredient', 'ingredient_name', 'ingredient_details', 'quantity_g']

class DishSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    ingredients_details = DishIngredientSerializer(source='dishingredient_set', many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Dish
        fields = '__all__'
    
    def get_image_url(self, obj):
        if not obj.image:
            return None
        try:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Fallback if no request context
            image_url = str(obj.image.url) if hasattr(obj.image, 'url') else str(obj.image)
            if image_url.startswith('/'):
                return f"http://localhost:8000{image_url}"
            return f"http://localhost:8000/media/{image_url}" if not image_url.startswith('http') else image_url
        except Exception as e:
            print(f"Error getting image URL for {obj.name}: {e}")
            return None

class DishListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    price = serializers.DecimalField(source='base_price', max_digits=10, decimal_places=2, read_only=True)
    calories = serializers.IntegerField(source='calories_kcal', read_only=True)
    proteins = serializers.DecimalField(source='protein_g', max_digits=6, decimal_places=2, read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Dish
        fields = ['id', 'name', 'description', 'price', 'calories', 'proteins', 
                  'image', 'image_url', 'category_name', 'is_available', 'preparation_time']
    
    def get_image_url(self, obj):
        if not obj.image:
            return None
        try:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            # Fallback if no request context
            image_url = str(obj.image.url) if hasattr(obj.image, 'url') else str(obj.image)
            if image_url.startswith('/'):
                return f"http://localhost:8000{image_url}"
            return f"http://localhost:8000/media/{image_url}" if not image_url.startswith('http') else image_url
        except Exception as e:
            print(f"Error getting image URL for {obj.name}: {e}")
            return None

class DishCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dish
        fields = '__all__'