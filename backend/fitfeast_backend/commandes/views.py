# backend/fitfeast_backend/commandes/views.py
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Commande, LigneCommande
from .serializers import CommandeSerializer, LigneCommandeSerializer

class CommandeAdminViewSet(viewsets.ModelViewSet):
    """Admin endpoint for managing all orders"""
    queryset = Commande.objects.all()
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update order status"""
        commande = self.get_object()
        new_status = request.data.get('statut')
        if new_status in dict(Commande.STATUT_CHOICES):
            commande.statut = new_status
            commande.save()
            return Response(CommandeSerializer(commande).data)
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

class CommandeViewSet(viewsets.ModelViewSet):
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return Commande.objects.all()
        return Commande.objects.filter(client=self.request.user)
    
    def perform_create(self, serializer):
        commande = serializer.save(client=self.request.user)
        # Ajouter des points de fidélité
        self.request.user.loyalty_points += 10
        self.request.user.save()

class LigneCommandeViewSet(viewsets.ModelViewSet):
    serializer_class = LigneCommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return LigneCommande.objects.filter(commande__client=self.request.user)

