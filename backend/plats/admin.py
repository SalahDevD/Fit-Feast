from django.contrib import admin
from .models import DishCategory, Ingredient, Dish, DishIngredient

admin.site.register(DishCategory)
admin.site.register(Ingredient)

class DishIngredientInline(admin.TabularInline):
    model = DishIngredient
    extra = 1

@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ['name', 'base_price', 'calories_kcal', 'protein_g', 'is_available']
    list_filter = ['is_available', 'is_customizable']
    search_fields = ['name', 'description']
    inlines = [DishIngredientInline]