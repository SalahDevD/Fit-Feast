from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer, CartItemSerializer
from plats.models import Dish
from personnalisation.models import CustomDish

class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.all()
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user, status=Cart.Status.OPEN)
    
    def get_or_create_cart(self):
        """
        Retrieve the user's open cart using filter().first() instead of get_or_create.
        The unique constraint ensures only one OPEN cart exists per user.
        """
        cart = Cart.objects.filter(
            user=self.request.user,
            status=Cart.Status.OPEN
        ).first()
        
        if cart is None:
            cart = Cart.objects.create(
                user=self.request.user,
                status=Cart.Status.OPEN
            )
        
        return cart
    
    @action(detail=False, methods=['get'], url_path='my-cart')
    def my_cart(self, request):
        cart = self.get_or_create_cart()
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='add')
    def add_to_cart(self, request):
        try:
            serializer = AddToCartSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            cart = self.get_or_create_cart()
            dish_id = serializer.validated_data.get('dish_id')
            custom_dish_id = serializer.validated_data.get('custom_dish_id')
            quantity = serializer.validated_data['quantity']
            
            dish = None
            custom_dish = None
            unit_price = Decimal("0.00")
            
            if dish_id:
                dish = Dish.objects.filter(id=dish_id).first()
                if not dish:
                    return Response(
                        {'error': f'Dish {dish_id} not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                unit_price = Decimal(str(dish.base_price))
            elif custom_dish_id:
                custom_dish = CustomDish.objects.filter(
                    id=custom_dish_id, 
                    user=request.user
                ).first()
                if not custom_dish:
                    return Response(
                        {'error': f'CustomDish {custom_dish_id} not found or not yours'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                unit_price = Decimal(str(custom_dish.total_price))
            
            # Check if item already exists in cart
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                dish=dish,
                custom_dish=custom_dish,
                defaults={
                    'quantity': quantity, 
                    'unit_price': unit_price,
                    'line_total': unit_price * Decimal(str(quantity))
                }
            )
            
            if not created:
                # Item already exists, increment quantity
                cart_item.quantity += quantity
                cart_item.recalculate_line()
            
            # Update cart totals
            cart.recalculate_totals()
            
            return Response({
                'message': f'Article ajouté au panier (quantité: {quantity})',
                'cart': CartSerializer(cart).data
            }, status=status.HTTP_201_CREATED)
        except serializers.ValidationError as e:
            return Response(
                {'error': str(e.detail)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            print(f"Error in add_to_cart: {str(e)}")
            traceback.print_exc()
            return Response(
                {'error': f'Erreur lors de l\'ajout au panier: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='update-item')
    def update_item(self, request):
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')
        
        cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        cart_item.quantity = quantity
        cart_item.recalculate_line()
        
        cart = cart_item.cart
        cart.recalculate_totals()
        
        return Response({
            'message': 'Quantité mise à jour',
            'cart': CartSerializer(cart).data
        })
    
    @action(detail=False, methods=['post'], url_path='remove-item')
    def remove_item(self, request):
        item_id = request.data.get('item_id')
        
        cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
        cart_item.delete()
        
        cart = self.get_or_create_cart()
        cart.recalculate_totals()
        
        return Response({
            'message': 'Article supprimé',
            'cart': CartSerializer(cart).data
        })
    
    @action(detail=False, methods=['post'], url_path='clear')
    def clear_cart(self, request):
        cart = self.get_or_create_cart()
        cart.items.all().delete()
        cart.recalculate_totals()
        
        return Response({'message': 'Panier vidé'})
    
    @action(detail=False, methods=['get'], url_path='count')
    def cart_count(self, request):
        cart = self.get_or_create_cart()
        count = sum(item.quantity for item in cart.items.all())
        return Response({'count': count})