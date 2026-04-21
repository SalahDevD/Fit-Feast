from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Q
from .models import FAQCategory, FAQEntry, FAQFeedback
from .serializers import *

class FAQCategoryViewSet(viewsets.ModelViewSet):
    queryset = FAQCategory.objects.all()
    serializer_class = FAQCategorySerializer
    permission_classes = [AllowAny]

class FAQEntryViewSet(viewsets.ModelViewSet):
    queryset = FAQEntry.objects.all()
    serializer_class = FAQEntrySerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            faqs = self.queryset.filter(
                Q(question__icontains=query) | 
                Q(answer__icontains=query) | 
                Q(keywords__icontains=query)
            )
            serializer = FAQEntrySerializer(faqs, many=True)
            return Response(serializer.data)
        return Response([])
    
    @action(detail=False, methods=['get'], url_path='by-category/{category_id}')
    def by_category(self, request, category_id=None):
        faqs = self.queryset.filter(category_id=category_id)
        serializer = FAQEntrySerializer(faqs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='feedback')
    def give_feedback(self, request):
        serializer = FAQFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        faq = FAQEntry.objects.get(id=serializer.validated_data['faq_id'])
        
        if serializer.validated_data['was_helpful']:
            faq.helpful_count += 1
        else:
            faq.not_helpful_count += 1
        faq.save()
        
        # Enregistrer le feedback
        FAQFeedback.objects.create(
            entry=faq,
            user_id=request.user.id if request.user.is_authenticated else None,
            was_helpful=serializer.validated_data['was_helpful']
        )
        
        return Response({'message': 'Merci pour votre retour !'})