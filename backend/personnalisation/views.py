from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from plats.models import Dish
from .models import ComponentGroup, ComponentItem, ComponentChoice, CustomDish, CustomDishComponent
from .serializers import *

class ComponentGroupViewSet(viewsets.ModelViewSet):
    queryset = ComponentGroup.objects.all()
    serializer_class = ComponentGroupSerializer
    permission_classes = [AllowAny]

class ComponentChoiceViewSet(viewsets.ModelViewSet):
    queryset = ComponentChoice.objects.filter(is_available=True)
    serializer_class = ComponentChoiceSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'], url_path='by-group')
    def by_group(self, request):
        group_id = request.query_params.get('group_id')
        if group_id:
            components = self.queryset.filter(group_id=group_id)
            serializer = ComponentChoiceSerializer(components, many=True)
            return Response(serializer.data)
        return Response({'error': 'group_id requis'}, status=400)

class CustomDishViewSet(viewsets.ModelViewSet):
    queryset = CustomDish.objects.all()
    serializer_class = CustomDishSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CustomDish.objects.filter(user=self.request.user).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        try:
            create_serializer = CustomDishCreateSerializer(data=request.data)
            create_serializer.is_valid(raise_exception=True)
            
            data = create_serializer.validated_data
            components_ids = data['components']
            
            # Require base_dish to create a CustomDish
            base_dish_id = data.get('base_dish_id')
            if not base_dish_id:
                return Response(
                    {'error': 'base_dish_id requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use filter().first() to safely get base_dish
            base_dish = Dish.objects.filter(id=base_dish_id).first()
            if not base_dish:
                return Response(
                    {'error': f'Base dish {base_dish_id} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Récupérer tous les composants (use ComponentItem, not ComponentChoice)
            components = ComponentItem.objects.filter(id__in=components_ids)
            
            if len(components) != len(components_ids):
                return Response(
                    {'error': 'Some component IDs not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Créer le plat personnalisé
            custom_dish = CustomDish.objects.create(
                user=request.user,
                base_dish=base_dish,
                title=data.get('title', ''),
            )
            
            # Ajouter les composants
            for component in components:
                CustomDishComponent.objects.create(
                    custom_dish=custom_dish,
                    component_item=component,
                    quantity=1
                )
            
            # Recalculate totals from base_dish + components
            custom_dish.recalculate_totals(save=True)
            
            serializer = CustomDishSerializer(custom_dish)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback
            print(f"Error in create: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='add-component')
    def add_component(self, request, pk=None):
        try:
            custom_dish = self.get_object()
            component_id = request.data.get('component_id')
            quantity = request.data.get('quantity', 1)
            
            if not component_id:
                return Response(
                    {'error': 'component_id requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use filter().first() instead of get() to handle missing components gracefully
            component = ComponentItem.objects.filter(id=component_id).first()
            if not component:
                return Response(
                    {'error': f'Component {component_id} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            CustomDishComponent.objects.create(
                custom_dish=custom_dish,
                component_item=component,
                quantity=quantity
            )
            
            # Recalculate totals using component_item relationship
            custom_dish.recalculate_totals(save=True)
            
            serializer = CustomDishSerializer(custom_dish)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"Error in add_component: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['delete'], url_path='remove-component')
    def remove_component(self, request, pk=None):
        try:
            custom_dish = self.get_object()
            component_id = request.data.get('component_id')
            
            if not component_id:
                return Response(
                    {'error': 'component_id requis'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use filter() instead of get() for safer deletion
            deleted_count, _ = CustomDishComponent.objects.filter(
                custom_dish=custom_dish, 
                component_item_id=component_id
            ).delete()
            
            if deleted_count == 0:
                return Response(
                    {'error': f'Component not found in this dish'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Recalculate totals after removal
            custom_dish.recalculate_totals(save=True)
            
            serializer = CustomDishSerializer(custom_dish)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"Error in remove_component: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        # Recalculer les totaux
        components = custom_dish.customdishcomponent_set.all()
        custom_dish.total_calories = sum(c.component.calories for c in components)
        custom_dish.total_proteins = sum(c.component.proteins for c in components)
        custom_dish.total_price = sum(float(c.component.price_extra) for c in components)
        custom_dish.save()
        
        serializer = CustomDishSerializer(custom_dish)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='available-components')
    def available_components(self, request):
        try:
            # Prefetch items (not 'choices') since ComponentGroup.items is the FK relationship
            groups = ComponentGroup.objects.prefetch_related('items').filter(is_active=True)
            serializer = ComponentGroupSerializer(groups, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"Error in available_components: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Failed to fetch available components: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )