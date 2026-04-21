from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from datetime import datetime, timedelta
from .models import MealPlan, MealPlanItem
from .serializers import *
from plats.models import Dish
from personnalisation.models import CustomDish

class MealPlanViewSet(viewsets.ModelViewSet):
    queryset = MealPlan.objects.all()
    serializer_class = MealPlanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return MealPlan.objects.filter(user=self.request.user).order_by('-week_start_date')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            create_serializer = MealPlanCreateSerializer(data=request.data)
            create_serializer.is_valid(raise_exception=True)
            
            data = create_serializer.validated_data
            week_start_date = data['week_start_date']
            
            # Vérifier si un plan existe déjà pour cette semaine
            existing = MealPlan.objects.filter(user=request.user, week_start_date=week_start_date).first()
            if existing:
                return Response({'error': 'Un plan existe déjà pour cette semaine'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Créer le plan
            meal_plan = MealPlan.objects.create(
                user=request.user,
                week_start_date=week_start_date
            )
            
            # Ajouter les items
            for item_data in data['items']:
                dish = None
                custom_dish = None
                
                if item_data.get('dish_id'):
                    dish = Dish.objects.filter(id=item_data['dish_id']).first()
                    if not dish:
                        return Response(
                            {'error': f"Dish {item_data['dish_id']} not found"}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                elif item_data.get('custom_dish_id'):
                    custom_dish = CustomDish.objects.filter(
                        id=item_data['custom_dish_id'], 
                        user=request.user
                    ).first()
                    if not custom_dish:
                        return Response(
                            {'error': f"CustomDish {item_data['custom_dish_id']} not found"}, 
                            status=status.HTTP_404_NOT_FOUND
                        )
                
                # Create meal plan item with correct field names (plan, day, day_of_week from request)
                try:
                    MealPlanItem.objects.create(
                        plan=meal_plan,
                        day=item_data.get('day'),  # Use the actual day field
                        meal_type=item_data['meal_type'],
                        dish=dish,
                        custom_dish=custom_dish,
                        notes=item_data.get('notes', '')
                    )
                except Exception as e:
                    meal_plan.delete()  # Rollback if item creation fails
                    return Response(
                        {'error': f'Error creating meal plan item: {str(e)}'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            serializer = MealPlanSerializer(meal_plan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            print(f"Error in create: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de la création du plan: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='current-week')
    def current_week(self, request):
        try:
            today = datetime.now().date()
            start_of_week = today - timedelta(days=today.weekday())
            
            meal_plan = MealPlan.objects.filter(user=request.user, week_start_date=start_of_week).first()
            if meal_plan:
                serializer = MealPlanSerializer(meal_plan)
                return Response(serializer.data, status=status.HTTP_200_OK)
            # Return 200 with null data instead of 404 - it's not an error, just no data
            return Response(None, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"Error in current_week: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du chargement du plan: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='next-week')
    def next_week(self, request):
        try:
            today = datetime.now().date()
            start_of_week = today - timedelta(days=today.weekday())
            next_week_start = start_of_week + timedelta(days=7)
            
            meal_plan = MealPlan.objects.filter(user=request.user, week_start_date=next_week_start).first()
            if meal_plan:
                serializer = MealPlanSerializer(meal_plan)
                return Response(serializer.data, status=status.HTTP_200_OK)
            # Return 200 with null data instead of 404
            return Response(None, status=status.HTTP_200_OK)
        except Exception as e:
            import traceback
            print(f"Error in next_week: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du chargement du plan: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'], url_path='week/{week_start}')
    def get_by_week(self, request, week_start=None):
        try:
            from datetime import datetime as dt
            week_start_date = dt.strptime(week_start, '%Y-%m-%d').date()
            meal_plan = MealPlan.objects.filter(user=request.user, week_start_date=week_start_date).first()
            if meal_plan:
                serializer = MealPlanSerializer(meal_plan)
                return Response(serializer.data, status=status.HTTP_200_OK)
            # Return 200 with null data instead of 404
            return Response(None, status=status.HTTP_200_OK)
        except ValueError:
            return Response(
                {'error': 'Format de date invalide (utilisez YYYY-MM-DD)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            print(f"Error in get_by_week: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors du chargement du plan: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='add-item')
    def add_item(self, request, pk=None):
        try:
            meal_plan = self.get_object()
            
            dish_id = request.data.get('dish_id')
            custom_dish_id = request.data.get('custom_dish_id')
            day = request.data.get('day')
            meal_type = request.data.get('meal_type')
            notes = request.data.get('notes', '')
            
            if not day or not meal_type:
                return Response(
                    {'error': "'day' et 'meal_type' requis"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            dish = None
            custom_dish = None
            
            if dish_id:
                dish = Dish.objects.filter(id=dish_id).first()
                if not dish:
                    return Response(
                        {'error': f"Dish {dish_id} not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif custom_dish_id:
                custom_dish = CustomDish.objects.filter(
                    id=custom_dish_id, 
                    user=request.user
                ).first()
                if not custom_dish:
                    return Response(
                        {'error': f"CustomDish {custom_dish_id} not found"}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {'error': "'dish_id' ou 'custom_dish_id' requis"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            MealPlanItem.objects.create(
                plan=meal_plan,
                day=day,
                meal_type=meal_type,
                dish=dish,
                custom_dish=custom_dish,
                notes=notes
            )
            
            serializer = MealPlanSerializer(meal_plan)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"Error in add_item: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de l\'ajout d\'un item: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='remove-item')
    def remove_item(self, request, pk=None):
        """
        Delete an item from a meal plan.
        Expects item_id in query parameters: DELETE /api/meal-plans/{id}/remove-item/?item_id={item_id}
        """
        try:
            meal_plan = self.get_object()
            
            # Get item_id from query parameters
            item_id = request.query_params.get('item_id')
            if not item_id:
                return Response(
                    {'error': 'item_id query parameter is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use filter().first() instead of get() for safety
            item = MealPlanItem.objects.filter(id=item_id, plan=meal_plan).first()
            if not item:
                return Response(
                    {'error': f'MealPlanItem {item_id} not found in this meal plan'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            item.delete()
            
            serializer = MealPlanSerializer(meal_plan)
            return Response(
                {
                    'message': 'Item removed successfully',
                    'meal_plan': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            import traceback
            print(f"Error in remove_item: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de la suppression d\'un item: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from rest_framework.decorators import api_view, permission_classes

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_meal_plan_item(request, plan_id, item_id):
    """
    DELETE /api/meal-plans/<plan_id>/remove-item/<item_id>/
    
    Deletes a specific meal plan item.
    Only the meal plan owner can delete items from their plan.
    """
    try:
        # Get the meal plan and verify ownership
        meal_plan = MealPlan.objects.filter(id=plan_id, user=request.user).first()
        if not meal_plan:
            return Response(
                {'error': f'MealPlan {plan_id} not found or you do not have permission to access it'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the item and verify it belongs to this meal plan
        item = MealPlanItem.objects.filter(id=item_id, plan=meal_plan).first()
        if not item:
            return Response(
                {'error': f'MealPlanItem {item_id} not found in this meal plan'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete the item
        item.delete()
        
        # Return updated meal plan
        serializer = MealPlanSerializer(meal_plan)
        return Response(
            {
                'message': 'Item removed successfully',
                'meal_plan': serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    except MealPlan.DoesNotExist:
        return Response(
            {'error': 'MealPlan not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except MealPlanItem.DoesNotExist:
        return Response(
            {'error': 'MealPlanItem not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import traceback
        print(f"Error in delete_meal_plan_item: {str(e)}")
        traceback.print_exc()
        return Response(
            {'error': f'Error deleting meal plan item: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )