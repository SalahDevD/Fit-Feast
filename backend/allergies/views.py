from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Allergen, DietType, UserAllergy, UserDiet
from .serializers import *

class AllergenViewSet(viewsets.ModelViewSet):
    queryset = Allergen.objects.all()
    serializer_class = AllergenSerializer
    permission_classes = [AllowAny]

class DietTypeViewSet(viewsets.ModelViewSet):
    queryset = DietType.objects.all()
    serializer_class = DietTypeSerializer
    permission_classes = [AllowAny]

class UserAllergyViewSet(viewsets.ModelViewSet):
    queryset = UserAllergy.objects.all()
    serializer_class = UserAllergySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAllergy.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = AddUserAllergySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        allergy, created = UserAllergy.objects.get_or_create(
            user=request.user,
            allergen_id=serializer.validated_data['allergen_id']
        )
        
        return Response(UserAllergySerializer(allergy).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['delete'], url_path='remove')
    def remove_allergy(self, request):
        allergen_id = request.data.get('allergen_id')
        UserAllergy.objects.filter(user=request.user, allergen_id=allergen_id).delete()
        return Response({'message': 'Allergie supprimée'})

class UserDietViewSet(viewsets.ModelViewSet):
    queryset = UserDiet.objects.all()
    serializer_class = UserDietSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserDiet.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        serializer = AddUserDietSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        diet, created = UserDiet.objects.get_or_create(
            user=request.user,
            diet_id=serializer.validated_data['diet_id']
        )
        
        return Response(UserDietSerializer(diet).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['delete'], url_path='remove')
    def remove_diet(self, request):
        diet_id = request.data.get('diet_id')
        UserDiet.objects.filter(user=request.user, diet_id=diet_id).delete()
        return Response({'message': 'Régime supprimé'})