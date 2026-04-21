# backend/fitfeast_backend/plats/views.py
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Plat, Ingredient, CategorieIngredient
from .serializers import PlatSerializer, IngredientSerializer, CategorieIngredientSerializer

class PlatAdminViewSet(viewsets.ModelViewSet):
    """Admin endpoint for managing all dishes including unavailable ones"""
    queryset = Plat.objects.all()
    serializer_class = PlatSerializer
    permission_classes = [permissions.IsAdminUser]

class PlatViewSet(viewsets.ModelViewSet):
    queryset = Plat.objects.filter(disponible=True)
    serializer_class = PlatSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['proteines', 'calories']
    search_fields = ['nom', 'description']
    ordering_fields = ['prix', 'proteines', 'calories']

class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['id_categorie']

class CategorieIngredientViewSet(viewsets.ModelViewSet):
    queryset = CategorieIngredient.objects.all()
    serializer_class = CategorieIngredientSerializer
