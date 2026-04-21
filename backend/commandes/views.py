from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem, OrderStatusEvent
from .serializers import *
from panier.models import Cart
from fidelite.models import LoyaltyAccount, LoyaltyTransaction

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        elif user.role == 'employee':
            return Order.objects.all()
        return Order.objects.filter(user=user)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        from decimal import Decimal
        
        # Récupérer le panier actif avec le statut OPEN
        cart = Cart.objects.filter(user=request.user, status=Cart.Status.OPEN).first()
        if not cart or not cart.items.exists():
            return Response({'error': 'Panier vide'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Use the standard serializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Ensure cart totals are calculated
        cart.recalculate_totals()
        subtotal = cart.subtotal or Decimal("0.00")
        
        # Créer la commande avec les champs corrects
        order = Order.objects.create(
            user=request.user,
            subtotal=subtotal,
            total_amount=subtotal,
            status=Order.Status.PENDING,
            recipient_name=serializer.validated_data.get('recipient_name', request.user.username),
            recipient_phone=serializer.validated_data.get('recipient_phone', ''),
            delivery_type=serializer.validated_data.get('delivery_type', Order.DeliveryType.DELIVERY),
            addr_line1=serializer.validated_data.get('addr_line1', ''),
            addr_line2=serializer.validated_data.get('addr_line2', ''),
            addr_city=serializer.validated_data.get('addr_city', ''),
            addr_postal_code=serializer.validated_data.get('addr_postal_code', ''),
            addr_region=serializer.validated_data.get('addr_region', ''),
            addr_country_code=serializer.validated_data.get('addr_country_code', 'MA'),
            notes=serializer.validated_data.get('notes', ''),
            requested_delivery_at=serializer.validated_data.get('requested_delivery_at')
        )
        
        # Créer les items de commande
        for cart_item in cart.items.all():
            order_item = OrderItem.objects.create(
                order=order,
                dish=cart_item.dish,
                custom_dish=cart_item.custom_dish,
                quantity=cart_item.quantity,
                unit_price=cart_item.unit_price
            )
            # Calculate line_total
            order_item.recalculate_line()
        
        # Enregistrer l'événement de statut
        OrderStatusEvent.objects.create(
            order=order,
            from_status='',
            to_status=Order.Status.PENDING,
            actor=request.user,
            note='Commande créée'
        )
        
        # Marquer le panier comme CHECKED_OUT au lieu de simplement le désactiver
        cart.status = Cart.Status.CHECKED_OUT
        cart.save()
        
        output_serializer = OrderSerializer(order)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        order = self.get_object()
        
        # Vérifier les permissions
        if request.user.role not in ['admin', 'employee']:
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        
        status_serializer = OrderStatusUpdateSerializer(data=request.data)
        status_serializer.is_valid(raise_exception=True)
        
        new_status = status_serializer.validated_data['status']
        old_status = order.status
        
        order.status = new_status
        order.save()
        # The post_save signal in fidelite/models.py will handle loyalty points automatically
        # when status changes to "PAID"
        
        # Enregistrer l'événement
        OrderStatusEvent.objects.create(
            order=order,
            from_status=old_status,
            to_status=new_status,
            actor=request.user,
            note=status_serializer.validated_data.get('notes', '')
        )
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='timeline')
    def timeline(self, request, pk=None):
        order = self.get_object()
        events = order.status_events.all()
        serializer = OrderStatusEventSerializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-orders')
    def my_orders(self, request):
        orders = Order.objects.filter(user=request.user).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='status/{status}')
    def by_status(self, request, status=None):
        if request.user.role not in ['admin', 'employee']:
            return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
        
        orders = Order.objects.filter(status=status).order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)