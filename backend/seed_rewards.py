#!/usr/bin/env python
"""
Script to seed default rewards in the database
Run: python manage.py shell < seed_rewards.py
or: python seed_rewards.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from fidelite.models import Reward

# Check if rewards already exist
if Reward.objects.exists():
    print("✓ Rewards already exist in database")
else:
    print("Creating default rewards...")
    
    rewards = [
        {
            'name': 'Réduction 10%',
            'description': 'Réduction de 10% sur votre prochaine commande',
            'reward_type': Reward.RewardType.DISCOUNT_PERCENT,
            'points_cost': 100,
            'discount_percent': 10,
            'is_active': True,
        },
        {
            'name': 'Réduction 20%',
            'description': 'Réduction de 20% sur votre prochaine commande',
            'reward_type': Reward.RewardType.DISCOUNT_PERCENT,
            'points_cost': 250,
            'discount_percent': 20,
            'is_active': True,
        },
        {
            'name': 'Réduction 50 MAD',
            'description': '50 MAD de réduction sur votre prochaine commande',
            'reward_type': Reward.RewardType.DISCOUNT_PERCENT,
            'points_cost': 150,
            'discount_percent': 0,
            'is_active': True,
        },
        {
            'name': 'Plat gratuit - Salade',
            'description': 'Un plat de salade gratuit (max 150 MAD)',
            'reward_type': Reward.RewardType.FREE_DISH,
            'points_cost': 300,
            'is_active': True,
        },
        {
            'name': 'Plat gratuit - Sandwich',
            'description': 'Un sandwich gratuit (max 120 MAD)',
            'reward_type': Reward.RewardType.FREE_DISH,
            'points_cost': 200,
            'is_active': True,
        },
        {
            'name': 'Livraison gratuite',
            'description': 'Livraison gratuite sur votre prochaine commande',
            'reward_type': Reward.RewardType.DISCOUNT_PERCENT,
            'points_cost': 75,
            'is_active': True,
        },
    ]
    
    for reward_data in rewards:
        reward = Reward.objects.create(**reward_data)
        print(f"✓ Created: {reward.name} ({reward.points_cost} points)")
    
    print(f"\n✓ {len(rewards)} rewards created successfully!")
