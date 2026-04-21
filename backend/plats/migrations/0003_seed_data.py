# Generated migration - Load seed data with correct field names

from django.db import migrations
from decimal import Decimal
from django.utils import timezone
from django.utils.text import slugify
from datetime import timedelta


def load_seed_data(apps, schema_editor):
    """Load all seed data into database"""
    User = apps.get_model('users', 'User')
    DishCategory = apps.get_model('plats', 'DishCategory')
    Ingredient = apps.get_model('plats', 'Ingredient')
    Allergen = apps.get_model('allergies', 'Allergen')
    DietType = apps.get_model('allergies', 'DietType')
    Dish = apps.get_model('plats', 'Dish')
    ComponentGroup = apps.get_model('personnalisation', 'ComponentGroup')
    ComponentItem = apps.get_model('personnalisation', 'ComponentItem')
    Reward = apps.get_model('fidelite', 'Reward')
    LoyaltyAccount = apps.get_model('fidelite', 'LoyaltyAccount')
    Challenge = apps.get_model('social', 'Challenge')
    FAQCategory = apps.get_model('faq', 'FAQCategory')
    FAQEntry = apps.get_model('faq', 'FAQEntry')

    # ===== 1. DISH CATEGORIES =====
    categories = [
        DishCategory(id=1, name='Salades', is_active=True),
        DishCategory(id=2, name='Bowls', is_active=True),
        DishCategory(id=3, name='Wraps', is_active=True),
        DishCategory(id=4, name='Plats Chauds', is_active=True),
        DishCategory(id=5, name='Petit-déjeuner', is_active=True),
        DishCategory(id=6, name='Snacks', is_active=True),
        DishCategory(id=7, name='Boissons', is_active=True),
        DishCategory(id=8, name='Desserts', is_active=True),
    ]
    DishCategory.objects.all().delete()  # Clear first
    DishCategory.objects.bulk_create(categories)

    # ===== 2. INGREDIENTS =====
    ingredients_data = [
        # Proteins
        {'id': 1, 'name': 'Poulet grillé', 'slug': 'poulet-grille', 'calories_kcal_100g': 165, 'protein_g_100g': Decimal('31.00'), 'carbs_g_100g': Decimal('0.00'), 'fat_g_100g': Decimal('3.6')},
        {'id': 2, 'name': 'Boeuf haché 5%', 'slug': 'boeuf-hache-5', 'calories_kcal_100g': 152, 'protein_g_100g': Decimal('21.00'), 'carbs_g_100g': Decimal('0.00'), 'fat_g_100g': Decimal('7.0')},
        {'id': 3, 'name': 'Saumon', 'slug': 'saumon', 'calories_kcal_100g': 208, 'protein_g_100g': Decimal('20.00'), 'carbs_g_100g': Decimal('0.00'), 'fat_g_100g': Decimal('13.0')},
        {'id': 4, 'name': 'Tofu nature', 'slug': 'tofu-nature', 'calories_kcal_100g': 76, 'protein_g_100g': Decimal('8.00'), 'carbs_g_100g': Decimal('2.00'), 'fat_g_100g': Decimal('4.8')},
        {'id': 5, 'name': 'Oeuf poché', 'slug': 'oeuf-poche', 'calories_kcal_100g': 143, 'protein_g_100g': Decimal('13.00'), 'carbs_g_100g': Decimal('0.70'), 'fat_g_100g': Decimal('9.5')},
        {'id': 6, 'name': 'Lentilles corail', 'slug': 'lentilles-corail', 'calories_kcal_100g': 116, 'protein_g_100g': Decimal('9.00'), 'carbs_g_100g': Decimal('20.00'), 'fat_g_100g': Decimal('0.4')},
        {'id': 7, 'name': 'Poisson blanc', 'slug': 'poisson-blanc', 'calories_kcal_100g': 91, 'protein_g_100g': Decimal('19.00'), 'carbs_g_100g': Decimal('0.00'), 'fat_g_100g': Decimal('1.0')},
        {'id': 8, 'name': 'Seitan', 'slug': 'seitan', 'calories_kcal_100g': 147, 'protein_g_100g': Decimal('25.00'), 'carbs_g_100g': Decimal('9.00'), 'fat_g_100g': Decimal('2.0')},
        {'id': 9, 'name': 'Brocoli', 'slug': 'brocoli', 'calories_kcal_100g': 34, 'protein_g_100g': Decimal('2.8'), 'carbs_g_100g': Decimal('7.00'), 'fat_g_100g': Decimal('0.4')},
        {'id': 10, 'name': 'Carotte', 'slug': 'carotte', 'calories_kcal_100g': 41, 'protein_g_100g': Decimal('0.9'), 'carbs_g_100g': Decimal('10.00'), 'fat_g_100g': Decimal('0.2')},
        {'id': 11, 'name': 'Courgette', 'slug': 'courgette', 'calories_kcal_100g': 17, 'protein_g_100g': Decimal('1.2'), 'carbs_g_100g': Decimal('3.1'), 'fat_g_100g': Decimal('0.3')},
        {'id': 12, 'name': 'Poivron rouge', 'slug': 'poivron-rouge', 'calories_kcal_100g': 31, 'protein_g_100g': Decimal('1.0'), 'carbs_g_100g': Decimal('6.00'), 'fat_g_100g': Decimal('0.3')},
        {'id': 13, 'name': 'Épinards', 'slug': 'epinards', 'calories_kcal_100g': 23, 'protein_g_100g': Decimal('2.9'), 'carbs_g_100g': Decimal('3.6'), 'fat_g_100g': Decimal('0.4')},
        {'id': 14, 'name': 'Avocat', 'slug': 'avocat', 'calories_kcal_100g': 160, 'protein_g_100g': Decimal('2.0'), 'carbs_g_100g': Decimal('8.5'), 'fat_g_100g': Decimal('15.0')},
        {'id': 15, 'name': 'Tomate', 'slug': 'tomate', 'calories_kcal_100g': 18, 'protein_g_100g': Decimal('0.9'), 'carbs_g_100g': Decimal('3.9'), 'fat_g_100g': Decimal('0.2')},
        {'id': 16, 'name': 'Concombre', 'slug': 'concombre', 'calories_kcal_100g': 15, 'protein_g_100g': Decimal('0.7'), 'carbs_g_100g': Decimal('3.6'), 'fat_g_100g': Decimal('0.1')},
        {'id': 17, 'name': 'Riz basmati', 'slug': 'riz-basmati', 'calories_kcal_100g': 130, 'protein_g_100g': Decimal('2.7'), 'carbs_g_100g': Decimal('28.00'), 'fat_g_100g': Decimal('0.3')},
        {'id': 18, 'name': 'Quinoa', 'slug': 'quinoa', 'calories_kcal_100g': 120, 'protein_g_100g': Decimal('4.4'), 'carbs_g_100g': Decimal('21.00'), 'fat_g_100g': Decimal('1.9')},
        {'id': 19, 'name': 'Patate douce', 'slug': 'patate-douce', 'calories_kcal_100g': 86, 'protein_g_100g': Decimal('1.6'), 'carbs_g_100g': Decimal('20.00'), 'fat_g_100g': Decimal('0.1')},
        {'id': 20, 'name': 'Pâtes complètes', 'slug': 'pates-completes', 'calories_kcal_100g': 124, 'protein_g_100g': Decimal('5.0'), 'carbs_g_100g': Decimal('25.00'), 'fat_g_100g': Decimal('1.5')},
        {'id': 21, 'name': 'Semoule complète', 'slug': 'semoule-complete', 'calories_kcal_100g': 112, 'protein_g_100g': Decimal('3.8'), 'carbs_g_100g': Decimal('23.00'), 'fat_g_100g': Decimal('0.6')},
        {'id': 22, 'name': 'Riz sauvage', 'slug': 'riz-sauvage', 'calories_kcal_100g': 101, 'protein_g_100g': Decimal('4.0'), 'carbs_g_100g': Decimal('21.00'), 'fat_g_100g': Decimal('0.4')},
        {'id': 23, 'name': 'Sauce yaourt', 'slug': 'sauce-yaourt', 'calories_kcal_100g': 62, 'protein_g_100g': Decimal('2.0'), 'carbs_g_100g': Decimal('4.00'), 'fat_g_100g': Decimal('4.0')},
        {'id': 24, 'name': 'Sauce sésame', 'slug': 'sauce-sesame', 'calories_kcal_100g': 240, 'protein_g_100g': Decimal('5.0'), 'carbs_g_100g': Decimal('12.00'), 'fat_g_100g': Decimal('20.0')},
        {'id': 25, 'name': 'Guacamole', 'slug': 'guacamole', 'calories_kcal_100g': 160, 'protein_g_100g': Decimal('2.0'), 'carbs_g_100g': Decimal('9.00'), 'fat_g_100g': Decimal('14.0')},
        {'id': 26, 'name': 'Sauce tomate basilic', 'slug': 'sauce-tomate-basilic', 'calories_kcal_100g': 35, 'protein_g_100g': Decimal('1.2'), 'carbs_g_100g': Decimal('5.00'), 'fat_g_100g': Decimal('1.0')},
    ]
    
    ingredients = [Ingredient(**data) for data in ingredients_data]
    Ingredient.objects.all().delete()  # Clear existing first
    Ingredient.objects.bulk_create(ingredients)

    # ===== 3. ALLERGENS =====
    allergens_data = [
        {'id': 1, 'name': 'Gluten', 'slug': 'gluten', 'description': "Présent dans le blé, l'orge, le seigle"},
        {'id': 2, 'name': 'Lactose', 'slug': 'lactose', 'description': 'Présent dans les produits laitiers'},
        {'id': 3, 'name': 'Œufs', 'slug': 'oeufs', 'description': 'Allergie aux œufs'},
        {'id': 4, 'name': 'Poisson', 'slug': 'poisson', 'description': 'Allergie aux poissons'},
        {'id': 5, 'name': 'Crustacés', 'slug': 'crustaces', 'description': 'Allergie aux crustacés'},
        {'id': 6, 'name': 'Soja', 'slug': 'soja', 'description': 'Allergie au soja'},
        {'id': 7, 'name': 'Arachides', 'slug': 'arachides', 'description': 'Allergie aux arachides'},
        {'id': 8, 'name': 'Fruits à coque', 'slug': 'fruits-a-coque', 'description': 'Allergie aux noix, amandes, etc.'},
    ]
    allergens = [Allergen(**data) for data in allergens_data]
    Allergen.objects.all().delete()  # Clear first
    Allergen.objects.bulk_create(allergens)

    # ===== 4. DIET TYPES =====
    diets_data = [
        {'id': 1, 'name': 'Végétarien', 'slug': 'vegetarien', 'description': 'Sans viande ni poisson'},
        {'id': 2, 'name': 'Vegan', 'slug': 'vegan', 'description': 'Sans produits animaux'},
        {'id': 3, 'name': 'Sans gluten', 'slug': 'sans-gluten', 'description': 'Exclusion du gluten'},
        {'id': 4, 'name': 'Sans lactose', 'slug': 'sans-lactose', 'description': 'Exclusion du lactose'},
        {'id': 5, 'name': 'Keto', 'slug': 'keto', 'description': 'Faible en glucides, riche en lipides'},
        {'id': 6, 'name': 'High Protein', 'slug': 'high-protein', 'description': 'Riche en protéines'},
    ]
    diets = [DietType(**data) for data in diets_data]
    DietType.objects.all().delete()  # Clear first
    DietType.objects.bulk_create(diets)

    # ===== 5. DISHES =====
    dishes_data = [
        {'id': 1, 'name': 'Salade César Protein', 'description': 'Poulet grillé, parmesan, œuf, croûtons, sauce légère', 'base_price': Decimal('12.90'), 'calories_kcal': 480, 'protein_g': Decimal('35.00'), 'carbs_g': Decimal('25.00'), 'fat_g': Decimal('22.00'), 'is_available': True, 'is_customizable': False},
        {'id': 2, 'name': 'Salade Nordic Saumon', 'description': 'Saumon fumé, avocat, œuf, épinards, sauce citron', 'base_price': Decimal('14.90'), 'calories_kcal': 520, 'protein_g': Decimal('32.00'), 'carbs_g': Decimal('18.00'), 'fat_g': Decimal('30.00'), 'is_available': True, 'is_customizable': False},
        {'id': 3, 'name': 'Salade Végétarienne', 'description': 'Tofu grillé, quinoa, avocat, tomates, sauce sésame', 'base_price': Decimal('11.90'), 'calories_kcal': 450, 'protein_g': Decimal('20.00'), 'carbs_g': Decimal('45.00'), 'fat_g': Decimal('18.00'), 'is_available': True, 'is_customizable': False},
        {'id': 4, 'name': 'Salade Thaï', 'description': 'Poulet, mangue, coriandre, cacahuètes, sauce thaï', 'base_price': Decimal('13.90'), 'calories_kcal': 490, 'protein_g': Decimal('28.00'), 'carbs_g': Decimal('35.00'), 'fat_g': Decimal('20.00'), 'is_available': True, 'is_customizable': False},
        {'id': 5, 'name': 'Protein Bowl', 'description': 'Poulet, riz, brocoli, œuf, sauce soja', 'base_price': Decimal('13.90'), 'calories_kcal': 580, 'protein_g': Decimal('42.00'), 'carbs_g': Decimal('55.00'), 'fat_g': Decimal('18.00'), 'is_available': True, 'is_customizable': True},
        {'id': 6, 'name': 'Vegan Power Bowl', 'description': 'Tofu, quinoa, patate douce, épinards, sauce tahini', 'base_price': Decimal('12.90'), 'calories_kcal': 550, 'protein_g': Decimal('25.00'), 'carbs_g': Decimal('70.00'), 'fat_g': Decimal('16.00'), 'is_available': True, 'is_customizable': True},
        {'id': 7, 'name': 'Poké Bowl Saumon', 'description': 'Saumon, riz, avocat, concombre, algues, sauce sésame', 'base_price': Decimal('15.90'), 'calories_kcal': 560, 'protein_g': Decimal('30.00'), 'carbs_g': Decimal('65.00'), 'fat_g': Decimal('20.00'), 'is_available': True, 'is_customizable': True},
        {'id': 8, 'name': 'Burger Bowl', 'description': 'Boeuf, salade, tomate, oignon, sauce burger, frites', 'base_price': Decimal('14.90'), 'calories_kcal': 620, 'protein_g': Decimal('38.00'), 'carbs_g': Decimal('45.00'), 'fat_g': Decimal('28.00'), 'is_available': True, 'is_customizable': True},
        {'id': 9, 'name': 'Wrap Poulet Avocat', 'description': 'Poulet, avocat, salade, tomate, sauce yaourt', 'base_price': Decimal('10.90'), 'calories_kcal': 450, 'protein_g': Decimal('30.00'), 'carbs_g': Decimal('42.00'), 'fat_g': Decimal('18.00'), 'is_available': True, 'is_customizable': False},
        {'id': 10, 'name': 'Wrap Végétarien', 'description': 'Hoummous, falafels, crudités, sauce sésame', 'base_price': Decimal('9.90'), 'calories_kcal': 420, 'protein_g': Decimal('18.00'), 'carbs_g': Decimal('55.00'), 'fat_g': Decimal('15.00'), 'is_available': True, 'is_customizable': False},
        {'id': 11, 'name': 'Wrap Thon', 'description': 'Thon, œuf, salade, tomate, olives', 'base_price': Decimal('11.90'), 'calories_kcal': 440, 'protein_g': Decimal('32.00'), 'carbs_g': Decimal('38.00'), 'fat_g': Decimal('20.00'), 'is_available': True, 'is_customizable': False},
        {'id': 12, 'name': 'Wrap Boeuf', 'description': 'Boeuf, cheddar, salade, oignons caramélisés', 'base_price': Decimal('12.90'), 'calories_kcal': 520, 'protein_g': Decimal('35.00'), 'carbs_g': Decimal('45.00'), 'fat_g': Decimal('24.00'), 'is_available': True, 'is_customizable': False},
        {'id': 13, 'name': 'Poulet Curry Coco', 'description': 'Poulet, riz, légumes, sauce curry coco', 'base_price': Decimal('14.90'), 'calories_kcal': 580, 'protein_g': Decimal('38.00'), 'carbs_g': Decimal('60.00'), 'fat_g': Decimal('20.00'), 'is_available': True, 'is_customizable': False},
        {'id': 14, 'name': 'Saumon Teriyaki', 'description': 'Saumon, riz, brocoli, sauce teriyaki', 'base_price': Decimal('16.90'), 'calories_kcal': 540, 'protein_g': Decimal('35.00'), 'carbs_g': Decimal('55.00'), 'fat_g': Decimal('18.00'), 'is_available': True, 'is_customizable': False},
        {'id': 15, 'name': 'Buddha Bowl', 'description': 'Tofu, quinoa, légumes rôtis, sauce soja', 'base_price': Decimal('13.90'), 'calories_kcal': 520, 'protein_g': Decimal('22.00'), 'carbs_g': Decimal('70.00'), 'fat_g': Decimal('15.00'), 'is_available': True, 'is_customizable': False},
        {'id': 16, 'name': 'Pâtes Bolognaise Végé', 'description': 'Pâtes complètes, lentilles, sauce tomate', 'base_price': Decimal('12.90'), 'calories_kcal': 550, 'protein_g': Decimal('25.00'), 'carbs_g': Decimal('85.00'), 'fat_g': Decimal('12.00'), 'is_available': True, 'is_customizable': False},
        {'id': 17, 'name': 'Porridge Protein', 'description': 'Flocons avoine, whey, fruits rouges, amandes', 'base_price': Decimal('8.90'), 'calories_kcal': 450, 'protein_g': Decimal('28.00'), 'carbs_g': Decimal('55.00'), 'fat_g': Decimal('14.00'), 'is_available': True, 'is_customizable': False},
        {'id': 18, 'name': 'Omelette Healthy', 'description': '3 œufs, épinards, champignons, fromage allégé', 'base_price': Decimal('9.90'), 'calories_kcal': 380, 'protein_g': Decimal('30.00'), 'carbs_g': Decimal('8.00'), 'fat_g': Decimal('22.00'), 'is_available': True, 'is_customizable': False},
        {'id': 19, 'name': 'Smoothie Bowl', 'description': 'Banane, fruits rouges, granola, graines de chia', 'base_price': Decimal('8.90'), 'calories_kcal': 350, 'protein_g': Decimal('12.00'), 'carbs_g': Decimal('60.00'), 'fat_g': Decimal('8.00'), 'is_available': True, 'is_customizable': False},
        {'id': 20, 'name': 'Avocado Toast', 'description': 'Pain complet, avocat, œuf poché, graines', 'base_price': Decimal('8.90'), 'calories_kcal': 380, 'protein_g': Decimal('16.00'), 'carbs_g': Decimal('35.00'), 'fat_g': Decimal('20.00'), 'is_available': True, 'is_customizable': False},
        {'id': 21, 'name': 'Protein Bar Maison', 'description': 'Flocons avoine, whey, beurre cacahuète', 'base_price': Decimal('3.90'), 'calories_kcal': 220, 'protein_g': Decimal('18.00'), 'carbs_g': Decimal('20.00'), 'fat_g': Decimal('10.00'), 'is_available': True, 'is_customizable': False},
        {'id': 22, 'name': 'Falafels (x6)', 'description': 'Pois chiches, épices, sauce yaourt', 'base_price': Decimal('5.90'), 'calories_kcal': 280, 'protein_g': Decimal('12.00'), 'carbs_g': Decimal('35.00'), 'fat_g': Decimal('10.00'), 'is_available': True, 'is_customizable': False},
        {'id': 23, 'name': 'Yogurt Bowl', 'description': 'Skyr, granola, miel, fruits', 'base_price': Decimal('5.90'), 'calories_kcal': 260, 'protein_g': Decimal('20.00'), 'carbs_g': Decimal('30.00'), 'fat_g': Decimal('8.00'), 'is_available': True, 'is_customizable': False},
        {'id': 24, 'name': 'Fruits secs', 'description': 'Mélange amandes, noix, noix de cajou', 'base_price': Decimal('3.90'), 'calories_kcal': 180, 'protein_g': Decimal('6.00'), 'carbs_g': Decimal('10.00'), 'fat_g': Decimal('14.00'), 'is_available': True, 'is_customizable': False},
        {'id': 25, 'name': 'Detox Juice', 'description': 'Concombre, pomme, citron, gingembre', 'base_price': Decimal('4.90'), 'calories_kcal': 85, 'protein_g': Decimal('1.00'), 'carbs_g': Decimal('20.00'), 'fat_g': Decimal('0.00'), 'is_available': True, 'is_customizable': False},
        {'id': 26, 'name': 'Protein Shake', 'description': "Whey, lait d'amande, banane", 'base_price': Decimal('5.90'), 'calories_kcal': 220, 'protein_g': Decimal('25.00'), 'carbs_g': Decimal('18.00'), 'fat_g': Decimal('6.00'), 'is_available': True, 'is_customizable': False},
        {'id': 27, 'name': 'Matcha Latte', 'description': "Matcha, lait d'avoine", 'base_price': Decimal('4.90'), 'calories_kcal': 120, 'protein_g': Decimal('4.00'), 'carbs_g': Decimal('15.00'), 'fat_g': Decimal('5.00'), 'is_available': True, 'is_customizable': False},
        {'id': 28, 'name': 'Eau Infusée', 'description': 'Concombre, menthe, citron', 'base_price': Decimal('3.90'), 'calories_kcal': 15, 'protein_g': Decimal('0.00'), 'carbs_g': Decimal('4.00'), 'fat_g': Decimal('0.00'), 'is_available': True, 'is_customizable': False},
        {'id': 29, 'name': 'Banana Bread', 'description': 'Banane, farine complète, noix', 'base_price': Decimal('4.90'), 'calories_kcal': 280, 'protein_g': Decimal('8.00'), 'carbs_g': Decimal('42.00'), 'fat_g': Decimal('10.00'), 'is_available': True, 'is_customizable': False},
        {'id': 30, 'name': 'Energy Balls', 'description': 'Dattes, cacao, amandes, coco', 'base_price': Decimal('3.90'), 'calories_kcal': 150, 'protein_g': Decimal('4.00'), 'carbs_g': Decimal('18.00'), 'fat_g': Decimal('8.00'), 'is_available': True, 'is_customizable': False},
        {'id': 31, 'name': 'Cheesecake Protéiné', 'description': 'Fromage blanc, whey, spéculoos', 'base_price': Decimal('5.90'), 'calories_kcal': 240, 'protein_g': Decimal('22.00'), 'carbs_g': Decimal('20.00'), 'fat_g': Decimal('10.00'), 'is_available': True, 'is_customizable': False},
        {'id': 32, 'name': 'Fruits rouges', 'description': 'Fraises, framboises, myrtilles', 'base_price': Decimal('4.90'), 'calories_kcal': 80, 'protein_g': Decimal('1.00'), 'carbs_g': Decimal('18.00'), 'fat_g': Decimal('0.00'), 'is_available': True, 'is_customizable': False},
    ]
    dishes = [Dish(**data) for data in dishes_data]
    # Add slugs to dishes before bulk create
    for i, dish in enumerate(dishes):
        dish.slug = slugify(dishes_data[i]['name'])
    Dish.objects.all().delete()  # Clear first
    Dish.objects.bulk_create(dishes)

    # Link dishes to categories
    category_mapping = {tuple(range(1, 5)): 1, tuple(range(5, 9)): 2, tuple(range(9, 13)): 3, tuple(range(13, 17)): 4, tuple(range(17, 21)): 5, tuple(range(21, 25)): 6, tuple(range(25, 29)): 7, tuple(range(29, 33)): 8}
    for id_range, cat_id in category_mapping.items():
        cat = DishCategory.objects.get(id=cat_id)
        for dish_id in id_range:
            dish = Dish.objects.filter(id=dish_id).first()
            if dish:
                dish.categories.add(cat)

    # ===== 6. COMPONENT GROUPS & ITEMS =====
    groups_data = [
        {'id': 1, 'kind': 'PROTEIN', 'name': 'Protéine', 'is_active': True},
        {'id': 2, 'kind': 'VEGETABLE', 'name': 'Légumes', 'is_active': True},
        {'id': 3, 'kind': 'SIDE', 'name': 'Accompagnement', 'is_active': True},
        {'id': 4, 'kind': 'SAUCE', 'name': 'Sauce', 'is_active': True},
    ]
    groups = [ComponentGroup(**data) for data in groups_data]
    ComponentItem.objects.all().delete()  # Delete dependent objects first
    ComponentGroup.objects.all().delete()  # Clear first
    ComponentGroup.objects.bulk_create(groups)

    # Component items - simplified to only required fields
    items_data = [
        # Proteins
        (1, 1, 1, 'Poulet grillé', Decimal('2.50')),
        (2, 1, 2, 'Boeuf haché 5%', Decimal('3.00')),
        (3, 1, 3, 'Saumon', Decimal('4.00')),
        (4, 1, 4, 'Tofu nature', Decimal('2.00')),
        (5, 1, 5, 'Oeuf poché (x2)', Decimal('1.50')),
        (6, 1, 6, 'Lentilles corail', Decimal('1.50')),
        (7, 1, 7, 'Poisson blanc', Decimal('3.50')),
        (8, 1, 8, 'Seitan', Decimal('2.50')),
        # Vegetables
        (9, 2, 9, 'Brocoli', Decimal('0.00')),
        (10, 2, 10, 'Carotte râpée', Decimal('0.00')),
        (11, 2, 11, 'Courgette', Decimal('0.00')),
        (12, 2, 12, 'Poivron rouge', Decimal('0.00')),
        (13, 2, 13, 'Épinards', Decimal('0.00')),
        (14, 2, 14, 'Avocat', Decimal('1.50')),
        (15, 2, 15, 'Tomate cerise', Decimal('0.00')),
        (16, 2, 16, 'Concombre', Decimal('0.00')),
        # Sides
        (17, 3, 17, 'Riz basmati', Decimal('0.00')),
        (18, 3, 18, 'Quinoa', Decimal('1.00')),
        (19, 3, 19, 'Patate douce', Decimal('0.00')),
        (20, 3, 20, 'Pâtes complètes', Decimal('0.00')),
        (21, 3, 21, 'Semoule complète', Decimal('0.00')),
        (22, 3, 22, 'Riz sauvage', Decimal('1.50')),
        # Sauces
        (23, 4, 23, 'Sauce yaourt', Decimal('0.50')),
        (24, 4, 24, 'Sauce sésame', Decimal('0.50')),
        (25, 4, 25, 'Guacamole', Decimal('1.00')),
        (26, 4, 26, 'Sauce tomate basilic', Decimal('0.50')),
    ]
    
    ComponentItem.objects.all().delete()  # Clear existing
    items_to_create = []
    for item_id, group_id, ing_id, name, price_delta in items_data:
        items_to_create.append(ComponentItem(
            id=item_id,
            group_id=group_id,
            ingredient_id=ing_id,
            name=name,
            price_delta=price_delta,
            is_available=True,
        ))
    ComponentItem.objects.bulk_create(items_to_create)

    # ===== 7. REWARDS =====
    rewards_data = [
        {'id': 1, 'name': 'Réduction 5%', 'description': '5% de réduction sur votre prochaine commande', 'reward_type': 'DISCOUNT_PERCENT', 'points_cost': 500, 'discount_percent': 5, 'is_active': True},
        {'id': 2, 'name': 'Réduction 10%', 'description': '10% de réduction sur votre prochaine commande', 'reward_type': 'DISCOUNT_PERCENT', 'points_cost': 900, 'discount_percent': 10, 'is_active': True},
        {'id': 3, 'name': 'Plat gratuit', 'description': 'Un plat personnalisé offert', 'reward_type': 'FREE_DISH', 'points_cost': 1200, 'discount_percent': None, 'is_active': True},
    ]
    
    for reward_data in rewards_data:
        Reward.objects.get_or_create(
            id=reward_data['id'],
            defaults=reward_data
        )

    # ===== 8. CHALLENGES =====
    today = timezone.now().date()
    challenges_data = [
        {'id': 1, 'title': 'Challenge 5 repas', 'description': 'Commandez 5 repas healthy', 'start_date': today - timedelta(days=7), 'end_date': today + timedelta(days=23), 'goal_type': 'ORDERS_COUNT', 'target_value': 5, 'is_active': True},
        {'id': 2, 'title': 'Défi Protéines', 'description': 'Commandez 3 plats riches en protéines', 'start_date': today - timedelta(days=7), 'end_date': today + timedelta(days=23), 'goal_type': 'PROTEIN_TARGET', 'target_value': 90, 'is_active': True},
        {'id': 3, 'title': 'Défi Végétarien', 'description': 'Commandez 3 plats végétariens', 'start_date': today - timedelta(days=7), 'end_date': today + timedelta(days=23), 'goal_type': 'ORDERS_COUNT', 'target_value': 3, 'is_active': True},
    ]
    
    for challenge_data in challenges_data:
        Challenge.objects.get_or_create(
            id=challenge_data['id'],
            defaults=challenge_data
        )

    # ===== 9. FAQ =====
    faq_categories = [
        FAQCategory(id=1, name='Commandes', slug='commandes'),
        FAQCategory(id=2, name='Livraison', slug='livraison'),
        FAQCategory(id=3, name='Nutrition', slug='nutrition'),
        FAQCategory(id=4, name='Compte', slug='compte'),
        FAQCategory(id=5, name='Paiement', slug='paiement'),
    ]
    FAQEntry.objects.all().delete()  # Delete dependent objects first
    FAQCategory.objects.all().delete()  # Clear first
    FAQCategory.objects.bulk_create(faq_categories)

    faq_entries_data = [
        {'id': 1, 'category_id': 1, 'question': 'Comment passer commande ?', 'answer': "Pour passer commande, il vous suffit de parcourir notre menu, d'ajouter les plats souhaités à votre panier, puis de valider votre commande en renseignant vos informations de livraison et moyen de paiement.", 'is_published': True},
        {'id': 2, 'category_id': 1, 'question': 'Puis-je modifier ma commande après validation ?', 'answer': "Vous pouvez modifier votre commande tant qu'elle n'est pas encore en préparation. Contactez rapidement notre service client.", 'is_published': True},
        {'id': 3, 'category_id': 1, 'question': 'Comment annuler une commande ?', 'answer': 'Vous pouvez annuler votre commande dans les 5 minutes suivant sa validation depuis votre espace "Mes commandes".', 'is_published': True},
        {'id': 4, 'category_id': 2, 'question': 'Quels sont les délais de livraison ?', 'answer': 'La livraison est estimée entre 30 et 60 minutes selon votre localisation.', 'is_published': True},
        {'id': 5, 'category_id': 2, 'question': 'Quel est le montant minimum de commande ?', 'answer': 'Le montant minimum de commande est de 12€.', 'is_published': True},
        {'id': 6, 'category_id': 2, 'question': 'Les livraisons sont-elles gratuites ?', 'answer': "La livraison est offerte à partir de 25€ d'achat.", 'is_published': True},
        {'id': 7, 'category_id': 3, 'question': 'Comment sont calculées les calories ?', 'answer': 'Les calories sont calculées automatiquement en fonction des ingrédients sélectionnés. Chaque plat affiche ses valeurs nutritionnelles complètes.', 'is_published': True},
        {'id': 8, 'category_id': 3, 'question': 'Puis-je adapter les portions ?', 'answer': 'Oui, dans notre outil de personnalisation vous pouvez ajuster les quantités de chaque ingrédient.', 'is_published': True},
        {'id': 9, 'category_id': 3, 'question': 'Que faire en cas d\'allergie alimentaire ?', 'answer': 'Vous pouvez enregistrer vos allergies dans votre profil. Le système filtrera automatiquement les plats concernés.', 'is_published': True},
        {'id': 10, 'category_id': 4, 'question': 'Comment créer un compte ?', 'answer': 'Cliquez sur "Inscription" en haut à droite, renseignez vos informations et validez. C\'est gratuit et rapide !', 'is_published': True},
        {'id': 11, 'category_id': 4, 'question': 'Comment fonctionne le programme de fidélité ?', 'answer': 'Vous gagnez 1 point par euro dépensé. Accumulez des points et échangez-les contre des récompenses !', 'is_published': True},
        {'id': 12, 'category_id': 5, 'question': 'Quels moyens de paiement acceptez-vous ?', 'answer': 'Nous acceptons les cartes bancaires (Visa, Mastercard) et PayPal.', 'is_published': True},
        {'id': 13, 'category_id': 5, 'question': 'La facture est-elle disponible ?', 'answer': 'Oui, une facture PDF est générée automatiquement après chaque commande payée.', 'is_published': True},
    ]
    
    for entry_data in faq_entries_data:
        FAQEntry.objects.get_or_create(
            id=entry_data['id'],
            defaults=entry_data
        )

    # ===== 10. TEST USERS & LOYALTY ACCOUNTS =====
    # Note: Users are created via normal registration flow or admin interface
    # Creating users here causes signal handler issues in migration context
    # Users can register via the API or admin panel


def reverse_seed_data(apps, schema_editor):
    """Remove all seed data"""
    # Simply do nothing - keep the data in the database
    # This prevents issues with models in other apps during reverse
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('plats', '0002_dishcategory_is_active_and_more'),
    ]

    operations = [
        migrations.RunPython(load_seed_data, reverse_seed_data),
    ]
