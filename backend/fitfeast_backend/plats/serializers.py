from rest_framework import serializers
from .models import Plat, Ingredient, CategorieIngredient


class CategorieIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieIngredient
        fields = '__all__'


class IngredientSerializer(serializers.ModelSerializer):
    id_categorie_nom = serializers.CharField(source='id_categorie.nom', read_only=True)
    
    class Meta:
        model = Ingredient
        fields = ['id', 'nom', 'id_categorie', 'id_categorie_nom', 'unite']


class PlatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plat
        fields = '__all__'
