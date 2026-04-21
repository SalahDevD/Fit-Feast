from rest_framework import serializers
from .models import SocialPost, PostLike, PostComment, PostShare, Challenge, ChallengeParticipation
from users.serializers import UserSerializer
from plats.serializers import DishListSerializer
from personnalisation.serializers import CustomDishSerializer

class PostCommentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    formatted_time = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    
    class Meta:
        model = PostComment
        fields = ['id', 'post', 'user', 'user_details', 'content', 'created_at', 'formatted_time']
        read_only_fields = ['user', 'post', 'created_at']
    
    def get_content(self, obj):
        return obj.body
    
    def get_formatted_time(self, obj):
        from django.utils.dateformat import format as date_format
        return date_format(obj.created_at, 'd/m/Y H:i')

class PostLikeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = PostLike
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class SocialPostSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    dish_details = DishListSerializer(source='dish', read_only=True)
    custom_dish_details = CustomDishSerializer(source='custom_dish', read_only=True)
    is_liked_by_user = serializers.SerializerMethodField()
    formatted_time = serializers.SerializerMethodField()
    content = serializers.SerializerMethodField()
    comments_list = serializers.SerializerMethodField()
    
    class Meta:
        model = SocialPost
        fields = ['id', 'user', 'user_details', 'content', 'dish', 'dish_details', 
                  'custom_dish', 'custom_dish_details', 'image', 'visibility', 
                  'likes_count', 'comments_count', 'shares_count', 'created_at', 
                  'updated_at', 'is_liked_by_user', 'formatted_time', 'comments_list']
        read_only_fields = ['user', 'likes_count', 'comments_count', 'shares_count', 'created_at', 'updated_at']
    
    def get_content(self, obj):
        return obj.text
    
    def get_formatted_time(self, obj):
        from django.utils.dateformat import format as date_format
        return date_format(obj.created_at, 'd/m/Y H:i')
    
    def get_comments_list(self, obj):
        """Return serialized comments for this post"""
        comments = obj.comments.all().order_by('-created_at')
        return PostCommentSerializer(comments, many=True).data
    
    def get_is_liked_by_user(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(user=request.user).exists()
        return False

class SocialPostCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, allow_blank=False, max_length=5000)
    dish_id = serializers.IntegerField(required=False, allow_null=True)
    custom_dish_id = serializers.IntegerField(required=False, allow_null=True)
    image = serializers.ImageField(required=False, allow_null=True)
    
    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Le contenu du post ne peut pas être vide")
        return value.strip()
    
    def validate(self, data):
        # Ensure at least content is provided
        if not data.get('content'):
            raise serializers.ValidationError({'content': 'Le contenu est requis'})
        return data

class ChallengeSerializer(serializers.ModelSerializer):
    is_participating = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    participants_count = serializers.SerializerMethodField()
    goal_type_display = serializers.CharField(source='get_goal_type_display', read_only=True)
    
    class Meta:
        model = Challenge
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'goal_type', 'goal_type_display', 'target_value', 'is_active',
            'is_participating', 'progress', 'participants_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_participating(self, obj):
        """Check if current user is participating in this challenge"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # obj.participants is the related_name from ChallengeParticipation model
            return obj.participants.filter(user=request.user).exists()
        return False
    
    def get_progress(self, obj):
        """Get current user's progress on this challenge"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Use correct field name: participants instead of participations
            participation = obj.participants.filter(user=request.user).first()
            if participation:
                return {
                    'current': participation.progress_value,  # Corrected field name
                    'target': obj.target_value,  # Corrected field name
                    'percentage': int((participation.progress_value / obj.target_value) * 100) if obj.target_value > 0 else 0
                }
        return None
    
    def get_participants_count(self, obj):
        """Get count of participants"""
        try:
            return obj.participants.count()
        except Exception:
            return 0

class ChallengeParticipationSerializer(serializers.ModelSerializer):
    challenge_details = ChallengeSerializer(source='challenge', read_only=True)
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = ChallengeParticipation
        fields = [
            'id', 'challenge', 'challenge_details', 'user_details',
            'progress_value', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
        read_only_fields = ['user', 'current_progress', 'completed', 'completed_at']