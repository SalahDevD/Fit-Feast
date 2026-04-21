from rest_framework import serializers
from .models import PaymentIntent, Invoice
from commandes.serializers import OrderSerializer

class PaymentIntentSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    provider_display = serializers.CharField(source='get_provider_display', read_only=True)
    
    class Meta:
        model = PaymentIntent
        fields = ['id', 'order', 'provider', 'provider_display', 'status', 'status_display', 
                  'amount', 'currency', 'provider_reference', 'payload', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'payload']

class InvoiceSerializer(serializers.ModelSerializer):
    order_details = OrderSerializer(source='order', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'created_at', 'updated_at']

class CreatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    payment_method = serializers.CharField(default='card')