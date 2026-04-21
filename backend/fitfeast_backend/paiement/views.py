from rest_framework import viewsets, permissions
from .models import Paiement
from .serializers import PaiementSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payments"""
    queryset = Paiement.objects.all()
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own payments
        if self.request.user.is_staff:
            return Paiement.objects.all()
        return Paiement.objects.filter(commande__client=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save()
