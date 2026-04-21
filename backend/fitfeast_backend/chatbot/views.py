# backend/fitfeast_backend/chatbot/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ChatbotViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    
    def get_queryset(self):
        return Conversation.objects.filter(client=self.request.user)
    
    @action(detail=True, methods=['post'])
    def envoyer_message(self, request, pk=None):
        conversation = self.get_object()
        message_text = request.data.get('message', '')
        
        # Enregistrer le message de l'utilisateur
        message_user = Message.objects.create(
            conversation=conversation,
            message=message_text,
            est_utilisateur=True
        )
        
        # Générer une réponse simple (intégration OpenAI optionnelle)
        # Remplacez cette logique par votre propre chatbot
        bot_response_text = f"Echo: {message_text}"
        
        # Enregistrer la réponse du bot
        message_bot = Message.objects.create(
            conversation=conversation,
            message=bot_response_text,
            est_utilisateur=False
        )
        
        return Response({
            'user_message': MessageSerializer(message_user).data,
            'bot_message': MessageSerializer(message_bot).data
        })

