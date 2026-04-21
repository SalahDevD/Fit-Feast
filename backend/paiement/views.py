from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import PaymentIntent, Invoice
from .serializers import *
from commandes.models import Order
from fidelite.models import LoyaltyTransaction

class PaymentIntentViewSet(viewsets.ModelViewSet):
    queryset = PaymentIntent.objects.all()
    serializer_class = PaymentIntentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PaymentIntent.objects.filter(order__user=self.request.user)
    
    @transaction.atomic
    @action(detail=False, methods=['post'], url_path='create-payment')
    def create_payment(self, request):
        serializer = CreatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        order = get_object_or_404(Order, id=serializer.validated_data['order_id'], user=request.user)
        
        if order.status == Order.Status.PAID:
            return Response({'error': 'Commande déjà payée'}, status=400)
        
        # Map payment_method to provider
        payment_method = serializer.validated_data.get('payment_method', 'card')
        provider_map = {
            'card': PaymentIntent.Provider.STRIPE,
            'paypal': PaymentIntent.Provider.PAYPAL,
            'cash': PaymentIntent.Provider.CASH,
        }
        provider = provider_map.get(payment_method, PaymentIntent.Provider.STRIPE)
        
        # Créer le payment intent
        payment_intent = PaymentIntent.objects.create(
            order=order,
            amount=order.total_amount,
            provider=provider,
            status=PaymentIntent.Status.CREATED,
        )
        
        # Simuler le paiement (à remplacer par Stripe)
        payment_intent.status = PaymentIntent.Status.SUCCEEDED
        payment_intent.save()
        
        # Mettre à jour la commande - use Order.Status.PAID constant
        order.status = Order.Status.PAID
        order.save()
        # The post_save signal in fidelite/models.py will automatically award loyalty points
        
        # Générer la facture
        invoice = Invoice.objects.create(
            order=order,
            amount=order.total_amount,
            currency='MAD'
        )
        
        # Ajouter des points de fidélité
        from fidelite.models import LoyaltyAccount
        loyalty = LoyaltyAccount.objects.get(user=request.user)
        points_earned = int(order.total_amount)
        loyalty.apply_delta(points_earned, reason=f'Paiement commande #{order.order_number}', order=order)
        
        return Response({
            'message': 'Paiement réussi',
            'payment': PaymentIntentSerializer(payment_intent).data,
            'invoice': InvoiceSerializer(invoice).data
        })
    
    @action(detail=False, methods=['get'], url_path='payment-status')
    def payment_status(self, request):
        order_id = request.query_params.get('order_id')
        if not order_id:
            return Response({'error': 'order_id is required'}, status=400)
        payment = PaymentIntent.objects.filter(order_id=order_id, order__user=request.user).first()
        if payment:
            return Response({'status': payment.status})
        return Response({'status': 'not_found'}, status=404)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Invoice.objects.filter(user=self.request.user).order_by('-generated_at')
    
    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        invoice = self.get_object()
        if invoice.pdf_file:
            return Response({'pdf_url': invoice.pdf_file.url})
        return Response({'error': 'PDF non disponible'}, status=404)