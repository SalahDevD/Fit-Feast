from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import DishCategory, Ingredient, Dish
from .serializers import *

class DishCategoryViewSet(viewsets.ModelViewSet):
    queryset = DishCategory.objects.filter(is_active=True)
    serializer_class = DishCategorySerializer
    permission_classes = [AllowAny]

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '')
        ingredients = Ingredient.objects.filter(name__icontains=query)[:20]
        serializer = IngredientSerializer(ingredients, many=True)
        return Response(serializer.data)

class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.all()
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return DishListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return DishCreateUpdateSerializer
        return DishSerializer
    
    def get_queryset(self):
        queryset = Dish.objects.all()
        
        # Filtres
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__id=category)
        
        is_available = self.request.query_params.get('is_available')
        if is_available:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        
        min_price = self.request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)
        
        max_price = self.request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)
        
        max_calories = self.request.query_params.get('max_calories')
        if max_calories:
            queryset = queryset.filter(calories_kcal__lte=max_calories)
        
        min_proteins = self.request.query_params.get('min_proteins')
        if min_proteins:
            queryset = queryset.filter(protein_g__gte=min_proteins)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '')
        dishes = self.get_queryset().filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )[:50]
        serializer = DishListSerializer(dishes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='nutrition')
    def nutrition(self, request, pk=None):
        dish = self.get_object()
        return Response({
            'calories': dish.calories_kcal,
            'proteins': dish.protein_g,
            'carbs': dish.carbs_g,
            'fats': dish.fat_g,
            'per_portion': '100g'
        })
    
    @action(detail=False, methods=['get'], url_path='recommended')
    def recommended(self, request):
        """Recommandation basée sur les préférences utilisateur"""
        dishes = Dish.objects.filter(is_available=True).order_by('-calories_kcal')[:10]
        serializer = DishListSerializer(dishes, many=True)
        return Response(serializer.data)