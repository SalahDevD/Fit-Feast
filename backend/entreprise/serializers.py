from rest_framework import serializers
from .models import Company, CompanyMember, CompanyGroupOrder, CompanyInvoice
from users.serializers import UserSerializer

class CompanySerializer(serializers.ModelSerializer):
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = '__all__'
    
    def get_members_count(self, obj):
        return obj.members.count()

class CompanyMemberSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = CompanyMember
        fields = '__all__'
        read_only_fields = ['joined_at']

class CompanyGroupOrderSerializer(serializers.ModelSerializer):
    ordered_by_details = UserSerializer(source='ordered_by', read_only=True)
    total_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = CompanyGroupOrder
        fields = '__all__'
        read_only_fields = ['created_at', 'total_amount']
    
    def get_total_formatted(self, obj):
        return f"{obj.total_amount} €"

class CompanyGroupOrderCreateSerializer(serializers.Serializer):
    company_id = serializers.IntegerField()
    scheduled_date = serializers.DateField()
    scheduled_time = serializers.TimeField()
    delivery_address = serializers.CharField()
    special_instructions = serializers.CharField(required=False, allow_blank=True)

class CompanyInvoiceSerializer(serializers.ModelSerializer):
    group_order_details = CompanyGroupOrderSerializer(source='group_order', read_only=True)
    
    class Meta:
        model = CompanyInvoice
        fields = '__all__'
        read_only_fields = ['invoice_number', 'generated_at']