from rest_framework import serializers
from .models import FAQCategory, FAQEntry, FAQFeedback

class FAQCategorySerializer(serializers.ModelSerializer):
    entries_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FAQCategory
        fields = '__all__'
    
    def get_entries_count(self, obj):
        return obj.entries.filter(is_published=True).count()

class FAQEntrySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    helpful_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = FAQEntry
        fields = ['id', 'category', 'category_name', 'language', 'question', 'answer', 'is_published', 'keywords', 'embedding', 'helpful_count', 'not_helpful_count', 'helpful_percentage', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'helpful_count', 'not_helpful_count']
    
    def get_helpful_percentage(self, obj):
        feedbacks = obj.feedbacks.all()
        helpful = feedbacks.filter(was_helpful=True).count()
        total = feedbacks.count()
        if total > 0:
            return int((helpful / total) * 100)
        return 0

class FAQFeedbackSerializer(serializers.Serializer):
    faq_id = serializers.IntegerField()
    was_helpful = serializers.BooleanField()