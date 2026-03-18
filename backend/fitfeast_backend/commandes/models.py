from django.db import models
from users.models import User
from plats.models import Plat


class Commande(models.Model):

    STATUT_CHOICES = (
        ('attente', 'En attente'),
        ('payee', 'Payée'),
        ('preparee', 'Préparée'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE)
    date_commande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return str(self.id)


class LigneCommande(models.Model):

    commande = models.ForeignKey(Commande, on_delete=models.CASCADE)
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE)
    quantite = models.IntegerField()
    prix = models.DecimalField(max_digits=8, decimal_places=2)