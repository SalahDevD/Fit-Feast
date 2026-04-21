from rest_framework import serializers
from .models import LoyaltyAccount, LoyaltyTransaction, Reward, RewardRedemption

class LoyaltyAccountSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = LoyaltyAccount
        fields = ['id', 'user', 'user_name', 'points_balance', 'tier', 'created_at', 'updated_at']
        read_only_fields = ['user', 'points_balance', 'tier', 'created_at', 'updated_at']

class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    account_user = serializers.CharField(source='account.user.username', read_only=True)
    
    class Meta:
        model = LoyaltyTransaction
        fields = ['id', 'account', 'account_user', 'delta_points', 'reason', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = '__all__'

class RewardRedemptionSerializer(serializers.ModelSerializer):
    reward_name = serializers.CharField(source='reward.name', read_only=True)
    
    class Meta:
        model = RewardRedemption
        fields = '__all__'
        read_only_fields = ['user', 'redeemed_at', 'created_at', 'updated_at']

class RedeemRewardSerializer(serializers.Serializer):
    reward_id = serializers.IntegerField()