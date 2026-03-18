from django.db import models
from commandes.models import Commande

class Paiement(models.Model):

    METHODE_CHOICES = (
        ('carte', 'Carte'),
        ('paypal', 'Paypal'),
        ('espece', 'Espèce')
    )

    commande = models.ForeignKey(Commande, on_delete=models.CASCADE)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    methode = models.CharField(max_length=20, choices=METHODE_CHOICES)
    date_paiement = models.DateTimeField(auto_now_add=True)