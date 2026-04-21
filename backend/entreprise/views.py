from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Company, CompanyMember, CompanyGroupOrder, CompanyInvoice
from .serializers import *

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Company.objects.all()
        return Company.objects.filter(members__user=user)
    
    def create(self, request, *args, **kwargs):
        serializer = CompanySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        company = serializer.save()
        
        # Créer l'admin comme membre
        CompanyMember.objects.create(
            company=company,
            user=request.user,
            is_admin=True
        )
        
        return Response(serializer.data, status=201)
    
    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        company = self.get_object()
        user_id = request.data.get('user_id')
        
        # Vérifier que l'utilisateur actuel est admin de la company
        if not CompanyMember.objects.filter(company=company, user=request.user, is_admin=True).exists():
            return Response({'error': 'Non autorisé'}, status=403)
        
        member, created = CompanyMember.objects.get_or_create(
            company=company,
            user_id=user_id
        )
        
        return Response(CompanyMemberSerializer(member).data)
    
    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        company = self.get_object()
        members = company.members.all()
        serializer = CompanyMemberSerializer(members, many=True)
        return Response(serializer.data)

class CompanyGroupOrderViewSet(viewsets.ModelViewSet):
    queryset = CompanyGroupOrder.objects.all()
    serializer_class = CompanyGroupOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CompanyGroupOrder.objects.filter(company__members__user=self.request.user)
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = CompanyGroupOrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        company = Company.objects.get(id=data['company_id'])
        
        # Vérifier que l'utilisateur est membre
        if not CompanyMember.objects.filter(company=company, user=request.user).exists():
            return Response({'error': 'Vous n\'êtes pas membre de cette entreprise'}, status=403)
        
        group_order = CompanyGroupOrder.objects.create(
            company=company,
            ordered_by=request.user,
            scheduled_date=data['scheduled_date'],
            scheduled_time=data['scheduled_time'],
            delivery_address=data['delivery_address'],
            special_instructions=data.get('special_instructions', '')
        )
        
        return Response(CompanyGroupOrderSerializer(group_order).data, status=201)
    
    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm(self, request, pk=None):
        group_order = self.get_object()
        group_order.is_confirmed = True
        group_order.save()
        
        # Générer la facture
        invoice = CompanyInvoice.objects.create(
            company=group_order.company,
            group_order=group_order
        )
        
        return Response({
            'message': 'Commande groupée confirmée',
            'invoice': CompanyInvoiceSerializer(invoice).data
        })