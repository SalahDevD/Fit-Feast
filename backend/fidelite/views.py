from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import LoyaltyAccount, LoyaltyTransaction, Reward, RewardRedemption
from .serializers import *

class LoyaltyAccountViewSet(viewsets.ModelViewSet):
    queryset = LoyaltyAccount.objects.all()
    serializer_class = LoyaltyAccountSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return LoyaltyAccount.objects.all()
        return LoyaltyAccount.objects.filter(user=user)
    
    @action(detail=False, methods=['get'], url_path='my-account')
    def my_account(self, request):
        account, created = LoyaltyAccount.objects.get_or_create(user=request.user)
        serializer = LoyaltyAccountSerializer(account)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='transactions')
    def my_transactions(self, request):
        try:
            account = LoyaltyAccount.objects.get(user=request.user)
            transactions = account.transactions.all().order_by('-created_at')
            serializer = LoyaltyTransactionSerializer(transactions, many=True)
            return Response(serializer.data)
        except LoyaltyAccount.DoesNotExist:
            return Response({'error': 'Compte fidélité non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'], url_path='redeem')
    @transaction.atomic
    def redeem_reward(self, request):
        serializer = RedeemRewardSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reward = Reward.objects.get(id=serializer.validated_data['reward_id'], is_active=True)
        account = LoyaltyAccount.objects.get(user=request.user)
        
        if account.points_balance < reward.points_cost:
            return Response({'error': 'Points insuffisants'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Déduire les points
        account.apply_delta(-reward.points_cost, reason=f'Récompense: {reward.name}')
        
        # Enregistrer la redemption
        redemption = RewardRedemption.objects.create(
            user=request.user,
            reward=reward,
            points_spent=reward.points_cost
        )
        
        return Response({
            'message': f'Récompense "{reward.name}" débloquée !',
            'points_restants': account.points_balance,
            'redemption': RewardRedemptionSerializer(redemption).data
        })

class RewardViewSet(viewsets.ModelViewSet):
    queryset = Reward.objects.filter(is_active=True)
    serializer_class = RewardSerializer
    permission_classes = [IsAuthenticated]