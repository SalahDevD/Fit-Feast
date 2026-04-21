from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Sum, F
from django.utils import timezone
from datetime import datetime, timedelta

# Importer les modèles
from users.models import UserAddress
from plats.models import Dish, DishCategory, Ingredient
from commandes.models import Order, OrderItem
from panier.models import Cart, CartItem
from personnalisation.models import CustomDish, ComponentChoice
from fidelite.models import LoyaltyAccount, LoyaltyTransaction
from mealprep.models import MealPlan, MealPlanItem
from paiement.models import PaymentIntent, Invoice
from chatbot.models import ChatConversation, ChatMessage
from social.models import SocialPost, Challenge, ChallengeParticipation
from entreprise.models import Company, CompanyGroupOrder
from faq.models import FAQEntry

# Importer les sérializers
from .serializers import *

User = get_user_model()

# ========== AUTHENTIFICATION ==========
class RegisterViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    queryset = User.objects.none()
    
    def create(self, request):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            password2 = request.data.get('password2')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')
            phone = request.data.get('phone', '')
            
            if not email or not password:
                return Response({'error': 'Email et password requis'}, status=400)
            
            # Validate password2 if provided
            if password2 and password != password2:
                return Response({'password2': ['Les mots de passe ne correspondent pas']}, status=400)
            
            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email déjà utilisé'}, status=400)
            
            # Generate unique username from email
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            
            user = User.objects.create_user(
                email=email,
                username=username,
                password=password, 
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                role=User.Role.CUSTOMER
            )
            
            # Créer un compte fidélité
            LoyaltyAccount.objects.create(user=user, points=0)
            
            return Response({
                'message': 'Utilisateur créé',
                'user': UserSerializer(user).data
            }, status=201)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)

class LogoutViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Déconnecté'})
        except:
            return Response({'error': 'Token invalide'}, status=400)

# ========== UTILISATEURS ==========
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == User.Role.ADMIN:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        if request.method == 'GET':
            return Response(UserSerializer(request.user).data)
        else:
            serializer = UserSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

class UserAddressViewSet(viewsets.ModelViewSet):
    serializer_class = UserAddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserAddress.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# ========== PLATS ==========
class DishViewSet(viewsets.ModelViewSet):
    queryset = Dish.objects.filter(is_available=True)
    serializer_class = DishSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category')
        dishes = self.queryset.filter(category_id=category_id)
        return Response(DishSerializer(dishes, many=True).data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        dishes = self.queryset.filter(name__icontains=query)
        return Response(DishSerializer(dishes, many=True).data)

class DishCategoryViewSet(viewsets.ModelViewSet):
    queryset = DishCategory.objects.all()
    serializer_class = DishCategorySerializer
    permission_classes = [AllowAny]

# ========== PERSONNALISATION ==========
class CustomDishViewSet(viewsets.ModelViewSet):
    serializer_class = CustomDishSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CustomDish.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Calculer les valeurs nutritionnelles
        total_calories = 0
        total_proteins = 0
        total_price = 0
        
        # Récupérer les composants
        components = self.request.data.get('components', [])
        for component_id in components:
            comp = ComponentChoice.objects.get(id=component_id)
            total_calories += comp.calories
            total_proteins += comp.proteins
            total_price += comp.price
        
        serializer.save(
            user=self.request.user,
            calories_calculated=total_calories,
            proteins_calculated=total_proteins,
            price_calculated=total_price
        )

# ========== PANIER ==========
class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user, status=Cart.Status.OPEN)
    
    def get_or_create_cart(self):
        cart, created = Cart.objects.get_or_create(
            user=self.request.user,
            status=Cart.Status.OPEN,
            defaults={'user': self.request.user, 'status': Cart.Status.OPEN}
        )
        return cart
    
    @action(detail=False, methods=['get'], url_path='my-cart')
    def my_cart(self, request):
        cart = self.get_or_create_cart()
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='add')
    def add_item(self, request):
        from decimal import Decimal
        try:
            cart = self.get_or_create_cart()
            dish_id = request.data.get('dish_id')
            custom_dish_id = request.data.get('custom_dish_id')
            quantity = request.data.get('quantity', 1)
            
            dish = None
            custom_dish = None
            unit_price = Decimal("0.00")
            
            if dish_id:
                dish = Dish.objects.get(id=dish_id)
                unit_price = Decimal(str(dish.base_price))
            elif custom_dish_id:
                custom_dish = CustomDish.objects.get(id=custom_dish_id, user=request.user)
                unit_price = Decimal(str(custom_dish.total_price))
            
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                dish=dish,
                custom_dish=custom_dish,
                defaults={
                    'quantity': quantity, 
                    'unit_price': unit_price,
                    'line_total': unit_price * Decimal(str(quantity))
                }
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.recalculate_line()
            
            # Mettre à jour le total du panier
            cart.recalculate_totals()
            
            return Response({
                'message': 'Article ajouté au panier',
                'cart': CartSerializer(cart).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            print(f"Error in add_item: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='update-item')
    def update_item(self, request):
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')
        
        cart_item = CartItem.objects.get(id=item_id, cart__user=request.user)
        cart_item.quantity = quantity
        cart_item.recalculate_line()
        
        cart = cart_item.cart
        cart.recalculate_totals()
        
        return Response({
            'message': 'Quantité mise à jour',
            'cart': CartSerializer(cart).data
        })
    
    @action(detail=False, methods=['post'], url_path='remove-item')
    def remove_item(self, request):
        item_id = request.data.get('item_id')
        
        cart_item = CartItem.objects.get(id=item_id, cart__user=request.user)
        cart_item.delete()
        
        cart = self.get_or_create_cart()
        cart.recalculate_totals()
        
        return Response({
            'message': 'Article supprimé',
            'cart': CartSerializer(cart).data
        })
    
    @action(detail=False, methods=['post'], url_path='clear')
    def clear_cart(self, request):
        cart = self.get_or_create_cart()
        cart.items.all().delete()
        cart.recalculate_totals()
        
        return Response({'message': 'Panier vidé'})
    
    @action(detail=False, methods=['get'], url_path='count')
    def cart_count(self, request):
        cart = self.get_or_create_cart()
        count = sum(item.quantity for item in cart.items.all())
        return Response({'count': count})

# ========== COMMANDES ==========
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == User.Role.ADMIN:
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        from decimal import Decimal
        try:
            # Get the user's active OPEN cart
            cart = Cart.objects.get(user=self.request.user, status=Cart.Status.OPEN)
            
            # Ensure cart totals are recalculated
            cart.recalculate_totals()
            
            # Ensure we have valid Decimal amounts
            subtotal = cart.subtotal or Decimal("0.00")
            
            # Create the order with correct status
            order = serializer.save(
                user=self.request.user,
                subtotal=subtotal,
                total_amount=subtotal,  # Can be adjusted with taxes/shipping
                status=Order.Status.PENDING
            )
            
            # Create order items from cart items
            for cart_item in cart.items.all():
                # Prepare the order item data
                order_item_data = {
                    'order': order,
                    'quantity': cart_item.quantity,
                    'unit_price': cart_item.unit_price,
                }
                
                # Set either dish or custom_dish (XOR constraint)
                if cart_item.dish:
                    order_item_data['dish'] = cart_item.dish
                elif cart_item.custom_dish:
                    order_item_data['custom_dish'] = cart_item.custom_dish
                
                order_item = OrderItem.objects.create(**order_item_data)
                # Calculate line_total for each item
                order_item.recalculate_line()
            
            # Mark cart as checked out instead of deleting it
            cart.status = Cart.Status.CHECKED_OUT
            cart.save()
            
            return order
        except Cart.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Pas de panier actif trouvé")
        except Exception as e:
            import traceback
            print(f"Error in perform_create order: {str(e)}")
            traceback.print_exc()
            from rest_framework.exceptions import ValidationError
            raise ValidationError(f"Erreur lors de la création de la commande: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        
        if request.user.role in [User.Role.ADMIN, User.Role.EMPLOYEE]:
            order.status = new_status
            order.save()
            
            # Si commande livrée, ajouter des points de fidélité
            if new_status == Order.Status.DELIVERED:
                loyalty = LoyaltyAccount.objects.get(user=order.user)
                points_earned = int(order.total_amount)
                loyalty.points += points_earned
                loyalty.save()
                
                LoyaltyTransaction.objects.create(
                    user=order.user,
                    points=points_earned,
                    transaction_type='earn',
                    description=f'Commande #{order.id}'
                )
            
            return Response(OrderSerializer(order).data)
        return Response({'error': 'Non autorisé'}, status=403)

# ========== FIDÉLITÉ ==========
class LoyaltyViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def my_account(self, request):
        account, created = LoyaltyAccount.objects.get_or_create(user=request.user)
        return Response(LoyaltyAccountSerializer(account).data)
    
    @action(detail=False, methods=['get'])
    def transactions(self, request):
        transactions = LoyaltyTransaction.objects.filter(user=request.user)
        return Response(LoyaltyTransactionSerializer(transactions, many=True).data)

# ========== MEAL PREP ==========
class MealPlanViewSet(viewsets.ModelViewSet):
    serializer_class = MealPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current_week(self, request):
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        plans = MealPlan.objects.filter(
            user=request.user,
            week_start_date__gte=start_of_week,
            week_start_date__lte=end_of_week
        )
        return Response(MealPlanSerializer(plans, many=True).data)

# ========== CHATBOT ==========
class ChatbotViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def message(self, request):
        user_message = request.data.get('message', '')
        conversation_id = request.data.get('conversation_id')
        
        if conversation_id:
            conversation = ChatConversation.objects.get(id=conversation_id, user=request.user)
        else:
            conversation = ChatConversation.objects.create(user=request.user)
        
        # Sauvegarder le message utilisateur
        ChatMessage.objects.create(
            conversation=conversation,
            sender='user',
            message=user_message
        )
        
        # Logique simple de réponse (à améliorer avec IA)
        bot_response = self.get_bot_response(user_message, request.user)
        
        # Sauvegarder la réponse du bot
        ChatMessage.objects.create(
            conversation=conversation,
            sender='bot',
            message=bot_response
        )
        
        return Response({
            'conversation_id': conversation.id,
            'response': bot_response
        })
    
    def get_bot_response(self, message, user):
        message_lower = message.lower()
        
        if 'calories' in message_lower:
            return "Je peux vous aider à calculer les calories ! Utilisez notre outil de personnalisation des plats."
        elif 'plat' in message_lower and 'rapide' in message_lower:
            return "Voici un plat rapide recommandé : Salade de poulet grillé - 350 calories, 30g de protéines."
        elif 'allergie' in message_lower:
            return "Vous pouvez gérer vos allergies dans votre profil. Nous filtrons automatiquement les plats."
        elif 'fidélité' in message_lower:
            return f"Vous avez actuellement {LoyaltyAccount.objects.get(user=user).points} points !"
        else:
            return "Merci pour votre message ! Je suis là pour vous aider avec vos commandes, la personnalisation des plats, ou vos objectifs nutritionnels."

# ========== SOCIAL ==========
class SocialPostViewSet(viewsets.ModelViewSet):
    serializer_class = SocialPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SocialPost.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        post.likes_count += 1
        post.save()
        return Response({'likes': post.likes_count})

# ========== CHALLENGES ==========
class ChallengeViewSet(viewsets.ModelViewSet):
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            return Challenge.objects.filter(is_active=True)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Challenge.objects.none()
    
    def list(self, request, *args, **kwargs):
        """Override list to provide error handling and always return a list"""
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error in ChallengeViewSet.list: {str(e)}")
            # Return empty list instead of 500 error
            return Response([], status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Add current user to challenge participants"""
        try:
            challenge = self.get_object()
            
            # Create or get participation using obj.participants relation
            participation, created = ChallengeParticipation.objects.get_or_create(
                challenge=challenge,
                user=request.user,
                defaults={
                    'progress_value': 0
                }
            )
            
            if created:
                return Response({
                    'message': 'Défi rejoint avec succès!',
                    'participation_id': participation.id,
                    'challenge_id': challenge.id
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Vous participez déjà à ce défi',
                    'participation_id': participation.id,
                    'challenge_id': challenge.id
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error in join: {str(e)}")
            return Response({
                'error': f'Erreur lors de l\'inscription: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """Update user's progress on a challenge"""
        try:
            challenge = self.get_object()
            progress = request.data.get('progress', 0)
            
            # Ensure user is participating
            participation, created = ChallengeParticipation.objects.get_or_create(
                user=request.user,
                challenge=challenge,
                defaults={'progress_value': 0}
            )
            
            # Update progress
            participation.progress_value = progress
            
            # Mark as completed if target reached
            if progress >= challenge.target_value and not participation.completed_at:
                participation.completed_at = timezone.now()
            
            participation.save()
            
            return Response({
                'message': 'Progrès mis à jour',
                'progress': participation.progress_value,
                'target': challenge.target_value,
                'completed': participation.completed_at is not None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Error in update_progress: {str(e)}")
            return Response({
                'error': f'Erreur lors de la mise à jour: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def my_challenges(self, request):
        participations = ChallengeParticipation.objects.filter(user=request.user)
        serializer = ChallengeParticipationSerializer(participations, many=True)
        return Response(serializer.data)

# ========== PAIEMENT ==========
class PaymentViewSet(viewsets.GenericViewSet):
    """
    ViewSet pour gérer les paiements.
    POST /api/payment/ - Créer un paiement
    """
    permission_classes = [IsAuthenticated]
    queryset = PaymentIntent.objects.all()
    
    def get_queryset(self):
        """Retourner les paiements de l'utilisateur authentifié"""
        return PaymentIntent.objects.filter(order__user=self.request.user)
    
    def create(self, request):
        """
        Créer un paiement pour une commande.
        
        Payload:
        {
            "order_id": 1,
            "payment_method": "card" ou "paypal"
        }
        """
        try:
            order_id = request.data.get('order_id')
            payment_method = request.data.get('payment_method', 'card')
            
            if not order_id:
                return Response(
                    {'error': 'order_id requis'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Vérifier que la commande existe et appartient à l'utilisateur
            try:
                order = Order.objects.get(id=order_id, user=request.user)
            except Order.DoesNotExist:
                return Response(
                    {'error': 'Commande non trouvée'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Vérifier si un paiement existe déjà
            if hasattr(order, 'payment_intent'):
                existing_payment = order.payment_intent
                if existing_payment.status == PaymentIntent.Status.SUCCEEDED:
                    return Response(
                        {'error': 'Commande déjà payée'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Créer l'intent de paiement
            payment_intent = PaymentIntent.objects.create(
                order=order,
                provider='STRIPE' if payment_method == 'card' else 'PAYPAL',
                status=PaymentIntent.Status.CREATED,
                amount=order.total_amount,
                currency=order.currency or 'MAD'
            )
            
            # Simuler le succès du paiement (à remplacer par intégration réelle)
            payment_intent.status = PaymentIntent.Status.SUCCEEDED
            payment_intent.save()
            
            # Mettre à jour le statut de la commande
            order.status = Order.Status.PAID
            order.save()
            
            return Response(
                {
                    'message': 'Paiement succès',
                    'payment_id': payment_intent.id,
                    'status': payment_intent.status,
                    'amount': str(payment_intent.amount),
                    'order_id': order.id
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du paiement: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Récupérer le statut d'un paiement.
        Paramètre: ?payment_id=1
        """
        payment_id = request.query_params.get('payment_id')
        if not payment_id:
            return Response(
                {'error': 'payment_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment = PaymentIntent.objects.get(
                id=payment_id,
                order__user=request.user
            )
            from paiement.serializers import PaymentIntentSerializer
            return Response(PaymentIntentSerializer(payment).data)
        except PaymentIntent.DoesNotExist:
            return Response(
                {'error': 'Paiement non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

# ========== ENTREPRISE ==========
class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == User.Role.ADMIN:
            return Company.objects.all()
        return Company.objects.filter(members__user=self.request.user)

# ========== FAQ ==========
class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQEntry.objects.all()
    serializer_class = FAQEntrySerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        faqs = self.queryset.filter(question__icontains=query)
        return Response(FAQEntrySerializer(faqs, many=True).data)