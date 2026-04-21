from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db import transaction
from django.utils import timezone
from .models import SocialPost, PostLike, PostComment, PostShare, Challenge, ChallengeParticipation
from .serializers import *

class SocialPostViewSet(viewsets.ModelViewSet):
    queryset = SocialPost.objects.all()
    serializer_class = SocialPostSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SocialPost.objects.all().order_by('-created_at')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context
    
    def create(self, request, *args, **kwargs):
        serializer = SocialPostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        post = SocialPost.objects.create(
            user=request.user,
            text=data['content'],
            dish_id=data.get('dish_id'),
            custom_dish_id=data.get('custom_dish_id'),
            image=data.get('image')
        )
        
        return Response(SocialPostSerializer(post, context={'request': request}).data, status=201)
    
    @action(detail=True, methods=['post'], url_path='like')
    def like(self, request, pk=None):
        post = self.get_object()
        like, created = PostLike.objects.get_or_create(user=request.user, post=post)
        
        if created:
            post.likes_count += 1
            post.save()
            return Response({'message': 'Post aimé', 'likes_count': post.likes_count})
        else:
            like.delete()
            post.likes_count -= 1
            post.save()
            return Response({'message': 'Like retiré', 'likes_count': post.likes_count})
    
    @action(detail=True, methods=['post'], url_path='comment')
    def comment(self, request, pk=None):
        post = self.get_object()
        content = request.data.get('content')
        
        if not content:
            return Response({'error': 'Contenu requis'}, status=400)
        
        comment = PostComment.objects.create(
            user=request.user,
            post=post,
            body=content
        )
        
        post.comments_count += 1
        post.save()
        
        return Response(PostCommentSerializer(comment).data, status=201)
    
    @action(detail=True, methods=['get'], url_path='comments')
    def get_comments(self, request, pk=None):
        post = self.get_object()
        comments = post.comments.all().order_by('created_at')
        serializer = PostCommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='my-posts')
    def my_posts(self, request):
        posts = SocialPost.objects.filter(user=request.user).order_by('-created_at')
        serializer = SocialPostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        # Posts des utilisateurs (simple feed)
        posts = SocialPost.objects.all().order_by('-created_at')[:50]
        serializer = SocialPostSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({'request': self.request})
        return context
    
    @action(detail=True, methods=['post'], url_path='join')
    def join(self, request, pk=None):
        """Add current user as participant to this challenge"""
        try:
            challenge = self.get_object()
            participation, created = ChallengeParticipation.objects.get_or_create(
                user=request.user,
                challenge=challenge,
                defaults={'progress_value': 0}  # Correct field name
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
            return Response({
                'error': f'Erreur lors de l\'inscription: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        """Update user progress on this challenge"""
        try:
            challenge = self.get_object()
            progress = request.data.get('progress', 0)
            
            participation, created = ChallengeParticipation.objects.get_or_create(
                user=request.user,
                challenge=challenge,
                defaults={'progress_value': 0}  # Correct field name
            )
            
            participation.progress_value = progress  # Correct field name
            if progress >= challenge.target_value and not participation.completed_at:  # Correct field names
                participation.completed_at = timezone.now()
                
                # Add reward points if challenge has reward_points field
                if hasattr(challenge, 'reward_points'):
                    try:
                        from fidelite.models import LoyaltyAccount, LoyaltyTransaction
                        loyalty = LoyaltyAccount.objects.get(user=request.user)
                        loyalty.add_points(challenge.reward_points)
                        
                        LoyaltyTransaction.objects.create(
                            user=request.user,
                            points=challenge.reward_points,
                            transaction_type='earn',
                            description=f'Défi complété: {challenge.title}'  # Correct field name
                        )
                    except Exception as reward_error:
                        print(f"Error adding reward points: {reward_error}")
                        # Continue even if reward fails
            
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
            return Response({
                'error': f'Erreur lors de la mise à jour: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='my-challenges')
    def my_challenges(self, request):
        """Get current user's challenge participations"""
        try:
            participations = ChallengeParticipation.objects.filter(user=request.user)
            serializer = ChallengeParticipationSerializer(participations, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Erreur: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)