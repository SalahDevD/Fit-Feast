from rest_framework import serializers
from .models import ChatConversation, ChatMessage, ChatRecommendation
from plats.serializers import DishListSerializer
from personnalisation.serializers import CustomDishSerializer

class ChatMessageSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    created_at_formatted = serializers.DateTimeField(source='created_at', format='%H:%M', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'conversation', 'role', 'role_display', 'content', 'created_at', 'created_at_formatted', 'metadata']
        read_only_fields = ['conversation', 'created_at', 'metadata']

class ChatConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = '__all__'
        read_only_fields = ['user', 'started_at', 'last_activity']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return ChatMessageSerializer(last_msg).data
        return None
    
    def get_messages_count(self, obj):
        return obj.messages.count()

class ChatRecommendationSerializer(serializers.ModelSerializer):
    dish_details = DishListSerializer(source='dish', read_only=True)
    custom_dish_details = CustomDishSerializer(source='custom_dish', read_only=True)
    
    class Meta:
        model = ChatRecommendation
        fields = '__all__'

class ChatMessageCreateSerializer(serializers.Serializer):
    message = serializers.CharField()
    conversation_id = serializers.IntegerField(required=False, allow_null=True)