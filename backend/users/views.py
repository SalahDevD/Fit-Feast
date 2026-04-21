from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import User, UserAddress
from .serializers import *

User = get_user_model()

# ========== CUSTOM TOKEN VIEW ==========
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Serializer that accepts email instead of username"""
    username_field = User.USERNAME_FIELD  # Uses 'email' as the login field
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Rename the username field to email
        self.fields[self.username_field].field_name = 'email'

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that accepts email for login"""
    serializer_class = CustomTokenObtainPairSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get', 'put'], url_path='profile')
    def profile(self, request):
        if request.method == 'GET':
            serializer = UserSerializer(request.user)
            return Response(serializer.data)
        else:
            serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(UserSerializer(request.user).data)
            return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({'old_password': 'Mot de passe incorrect'}, status=400)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Mot de passe modifié avec succès'})
        return Response(serializer.errors, status=400)
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '')
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query) | Q(first_name__icontains=query)
        )[:20]
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Inscription réussie'
        }, status=status.HTTP_201_CREATED)

class UserAddressViewSet(viewsets.ModelViewSet):
    queryset = UserAddress.objects.all()
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='default')
    def get_default(self, request):
        address = UserAddress.objects.filter(user=request.user, is_default=True).first()
        if address:
            serializer = UserAddressSerializer(address)
            return Response(serializer.data)
        return Response({'message': 'Aucune adresse par défaut'}, status=404)