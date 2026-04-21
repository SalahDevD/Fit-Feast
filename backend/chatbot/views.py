from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import ChatConversation, ChatMessage, ChatRecommendation
from .serializers import *
from plats.models import Dish
from allergies.models import UserAllergy, UserDiet
from fidelite.models import LoyaltyAccount
import re

class ChatConversationViewSet(viewsets.ModelViewSet):
    queryset = ChatConversation.objects.all()
    serializer_class = ChatConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChatConversation.objects.filter(user=self.request.user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ChatbotViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_or_create_conversation(self, user, conversation_id=None):
        if conversation_id:
            try:
                return ChatConversation.objects.get(id=conversation_id, user=user)
            except ChatConversation.DoesNotExist:
                pass
        return ChatConversation.objects.create(user=user)
    
    def process_message(self, message, user):
        message_lower = message.lower()
        
        # Détection des intents
        if any(word in message_lower for word in ['calorie', 'calories']):
            return self.handle_calories_query(message_lower, user)
        elif any(word in message_lower for word in ['protéine', 'proteine', 'protein']):
            return self.handle_protein_query(user)
        elif any(word in message_lower for word in ['plat', 'recommande', 'suggestion']):
            return self.handle_dish_recommendation(user)
        elif any(word in message_lower for word in ['point', 'fidélité', 'fidelite', 'récompense']):
            return self.handle_loyalty_query(user)
        elif any(word in message_lower for word in ['allergie', 'intolérance']):
            return self.handle_allergy_query(user)
        elif any(word in message_lower for word in ['commande', 'order', 'livraison']):
            return self.handle_order_query(user)
        elif any(word in message_lower for word in ['bonjour', 'salut', 'hello', 'hey']):
            return "Bonjour ! 👋 Comment puis-je vous aider aujourd'hui ?"
        elif any(word in message_lower for word in ['merci', 'thanks']):
            return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions 😊"
        else:
            return self.handle_general_query(message, user)
    
    def handle_calories_query(self, message, user):
        # Extraire les chiffres
        numbers = re.findall(r'\d+', message)
        if numbers:
            target = int(numbers[0])
            dishes = Dish.objects.filter(calories_kcal__lte=target, is_available=True)[:5]
            if dishes.exists():
                response = f"Voici des plats avec moins de {target} calories :\n"
                for dish in dishes:
                    response += f"- {dish.name}: {dish.calories_kcal} calories\n"
                return response
        return "Pour connaître les calories de nos plats, consultez notre menu ! Chaque plat affiche ses valeurs nutritionnelles."
    
    def handle_protein_query(self, user):
        high_protein_dishes = Dish.objects.filter(protein_g__gte=30, is_available=True)[:5]
        if high_protein_dishes.exists():
            response = "Voici nos plats les plus riches en protéines :\n"
            for dish in high_protein_dishes:
                response += f"- {dish.name}: {dish.protein_g}g de protéines\n"
            return response
        return "Nos plats contiennent entre 20g et 40g de protéines par portion."
    
    def handle_dish_recommendation(self, user):
        # Recommandation basée sur les préférences utilisateur
        allergies = UserAllergy.objects.filter(user=user).values_list('allergen_id', flat=True)
        
        dishes = Dish.objects.filter(is_available=True)
        
        # Exclure les plats avec allergènes
        # (Logique simplifiée)
        recommended = dishes[:5]
        
        response = "Voici mes recommandations du jour :\n"
        for dish in recommended:
            response += f"🍽️ {dish.name} - {dish.calories_kcal} cal | {dish.protein_g}g prot | {dish.base_price}€\n"
        return response + "\nVous pouvez aussi créer votre propre plat personnalisé !"
    
    def handle_loyalty_query(self, user):
        loyalty = LoyaltyAccount.objects.get_or_create(user=user)[0]
        return f"Vous avez actuellement {loyalty.points_balance} points de fidélité ! 🎉\nNiveau: {loyalty.tier}"
    
    def handle_allergy_query(self, user):
        allergies = UserAllergy.objects.filter(user=user)
        if allergies.exists():
            allergenes = [a.allergen.name for a in allergies]
            return f"Vos allergies enregistrées : {', '.join(allergenes)}\nNous filtrons automatiquement les plats contenant ces allergènes."
        return "Vous n'avez pas encore enregistré d'allergies. Vous pouvez le faire dans votre profil pour recevoir des recommandations adaptées."
    
    def handle_order_query(self, user):
        return "Pour passer commande :\n1. Parcourez notre menu\n2. Ajoutez des plats au panier\n3. Validez votre panier\n4. Choisissez votre adresse de livraison\n5. Payez en ligne\n\nBesoin d'aide pour une étape particulière ?"
    
    def handle_general_query(self, message, user):
        return "Je suis votre assistant Fit Feast ! Je peux vous aider avec :\n- Les valeurs nutritionnelles\n- Les recommandations de plats\n- Votre compte fidélité\n- La personnalisation des plats\n- La gestion des allergies\n\nQue souhaitez-vous savoir ?"
    
    @action(detail=False, methods=['post'], url_path='message')
    def send_message(self, request):
        serializer = ChatMessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_message = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id')
        
        # Récupérer ou créer la conversation
        conversation = self.get_or_create_conversation(request.user, conversation_id)
        
        # Sauvegarder le message utilisateur
        ChatMessage.objects.create(
            conversation=conversation,
            role=ChatMessage.Role.USER,
            content=user_message
        )
        
        # Générer la réponse
        bot_response = self.process_message(user_message, request.user)
        
        # Sauvegarder la réponse
        bot_message = ChatMessage.objects.create(
            conversation=conversation,
            role=ChatMessage.Role.ASSISTANT,
            content=bot_response
        )
        
        # Mettre à jour la conversation
        conversation.save()  # auto-update last_activity
        
        return Response({
            'conversation_id': conversation.id,
            'response': bot_response
        })
    
    @action(detail=False, methods=['get'], url_path='conversations')
    def list_conversations(self, request):
        conversations = ChatConversation.objects.filter(user=request.user).order_by('-updated_at')
        serializer = ChatConversationSerializer(conversations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='conversation/{conversation_id}')
    def get_conversation(self, request, conversation_id=None):
        conversation = ChatConversation.objects.get(id=conversation_id, user=request.user)
        messages = conversation.messages.all()
        return Response({
            'conversation': ChatConversationSerializer(conversation).data,
            'messages': ChatMessageSerializer(messages, many=True).data
        })