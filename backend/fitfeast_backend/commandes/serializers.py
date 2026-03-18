# backend/fitfeast_backend/commandes/serializers.py
from rest_framework import serializers
from .models import Commande, LigneCommande


class LigneCommandeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneCommande
        fields = '__all__'


class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    client_username = serializers.CharField(source='client.username', read_only=True)

    class Meta:
        model = Commande
        fields = ['id', 'client', 'client_username', 'date_commande', 'statut', 'total', 'lignes']
