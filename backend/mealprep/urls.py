from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import MealPlanViewSet, delete_meal_plan_item

router = DefaultRouter()
router.register(r'meal-plans', MealPlanViewSet, basename='mealplan')

urlpatterns = [
    # Custom DELETE route for removing items from meal plans
    # DELETE /api/meal-plans/<plan_id>/remove-item/<item_id>/
    path(
        'meal-plans/<int:plan_id>/remove-item/<int:item_id>/',
        delete_meal_plan_item,
        name='delete-meal-plan-item'
    ),
] + router.urls
