from rest_framework import serializers
from .models import Allergen, DietType, UserAllergy, UserDiet

class AllergenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergen
        fields = '__all__'

class DietTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietType
        fields = '__all__'

class UserAllergySerializer(serializers.ModelSerializer):
    allergen_name = serializers.CharField(source='allergen.name', read_only=True)
    
    class Meta:
        model = UserAllergy
        fields = '__all__'
        read_only_fields = ['user']

class UserDietSerializer(serializers.ModelSerializer):
    diet_name = serializers.CharField(source='diet.name', read_only=True)
    
    class Meta:
        model = UserDiet
        fields = '__all__'
        read_only_fields = ['user']

class AddUserAllergySerializer(serializers.Serializer):
    allergen_id = serializers.IntegerField()

class AddUserDietSerializer(serializers.Serializer):
    diet_id = serializers.IntegerField()