#!/usr/bin/env python
"""
Script to assign images to dishes from media/dishes folder
Run: python manage.py shell < assign_images.py
or: python assign_images.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.files.base import File
from django.conf import settings
from plats.models import Dish

MEDIA_DISHES_PATH = os.path.join(settings.MEDIA_ROOT, 'dishes')

# Get list of available images
image_files = [f for f in os.listdir(MEDIA_DISHES_PATH) if f.endswith(('.jpg', '.jpeg', '.png'))]

print(f"Found {len(image_files)} image files:")
for img in sorted(image_files):
    print(f"  - {img}")

# Mapping dish names to image files
image_mapping = {
    'Salade César Protein': 'SaladeCesar.jpg',
    'Salade Thaï': 'SaladeThai.jpg',
    'Salade Nordic Saumon': 'SaladeNordicSaumon.jpg',
    'Salade Végétarienne': 'SaladeVegetarienn.jpg',
    'Burger Bowl': 'BurgerBowl.jpg',
    'Protein Bowl': 'ProteinBowl.jpg',
    'Poké Bowl Saumon': 'PokeBowlSaumon.jpg',
    'Vegan Power Bowl': 'VeganPowerBowl.jpg',
    'Wrap Poulet Avocat': 'WrapPouletAvocat.jpg',
    'Wrap Végétarien': 'WrapVegetarien.jpg',
    'Wrap Thon': 'WrapThon.jpg',
    'Wrap Boeuf': 'WrapBoeuf.jpg',
    'Poulet Curry Coco': 'PouletCurryCoco.jpg',
    'Saumon Teriyaki': 'SaumonTeriyaki.jpg',
    'Buddha Bowl': 'BuddhaBowl.jpg',
    'Pâtes Bolognaise Végé': 'PâtesBolognaiseVégé.jpg',
    'Porridge Protein': 'PorridgeProtein.jpg',
    'Omelette Healthy': 'OmeletteHealthy.jpg',
    'Smoothie Bowl': 'SmoothieBowl.jpg',
    'Avocado Toast': 'AvocadoToast.jpg'
}

updated = 0
not_found = 0

for dish_name, image_filename in image_mapping.items():
    try:
        dish = Dish.objects.get(name__iexact=dish_name)
        image_path = f'dishes/{image_filename}'
        
        # Check if file exists in media directory
        full_path = os.path.join(MEDIA_DISHES_PATH, image_filename)
        if os.path.exists(full_path):
            # Assign image to dish
            dish.image = image_path
            dish.save()
            print(f"✓ {dish_name} <- {image_filename}")
            updated += 1
        else:
            print(f"✗ File not found: {full_path}")
            not_found += 1
    except Dish.DoesNotExist:
        print(f"✗ Dish not found: {dish_name}")
        not_found += 1
    except Exception as e:
        print(f"✗ Error with {dish_name}: {e}")
        not_found += 1

print(f"\n✓ Updated {updated} dishes")
if not_found > 0:
    print(f"⚠ {not_found} issues encountered")
