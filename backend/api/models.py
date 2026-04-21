from django.db import models
from django.conf import settings

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    points = models.IntegerField(default=0)
    allergies = models.TextField(blank=True, null=True)
    regime = models.CharField(max_length=100, blank=True, null=True)
    mode_sombre = models.BooleanField(default=False)

    def __str__(self):
        return self.user.email

class Plat(models.Model):
    nom = models.CharField(max_length=200)
    image = models.URLField(blank=True, null=True)
    description = models.TextField()
    ingredients = models.TextField()
    calories = models.IntegerField()
    proteines = models.IntegerField()
    prix = models.DecimalField(max_digits=6, decimal_places=2)
    disponible = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

class Personnalisation(models.Model):
    PROTEINES = [('poulet', 'Poulet'), ('tofu', 'Tofu'), ('boeuf', 'Boeuf')]
    LEGUMES = [('brocoli', 'Brocoli'), ('carotte', 'Carotte'), ('poivron', 'Poivron')]
    ACCOMPAGNEMENTS = [('riz', 'Riz'), ('quinoa', 'Quinoa'), ('patate', 'Patate')]
    CUISSON = [('grille', 'Grillé'), ('vapeur', 'Vapeur'), ('poele', 'Poêle')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    proteine = models.CharField(max_length=50, choices=PROTEINES)
    legumes = models.CharField(max_length=50, choices=LEGUMES)
    accompagnement = models.CharField(max_length=50, choices=ACCOMPAGNEMENTS)
    cuisson = models.CharField(max_length=50, choices=CUISSON)
    calories_calculees = models.IntegerField()
    proteines_calculees = models.IntegerField()
    prix_calcule = models.DecimalField(max_digits=6, decimal_places=2)
    date_creation = models.DateTimeField(auto_now_add=True)

class Commande(models.Model):
    STATUTS = [
        ('attente', 'En attente'),
        ('payee', 'Payée'),
        ('preparee', 'Préparée'),
        ('livree', 'Livrée'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date_commande = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='attente')
    total = models.DecimalField(max_digits=8, decimal_places=2)
    facture_pdf = models.FileField(upload_to='factures/', blank=True, null=True)

class LigneCommande(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    plat = models.ForeignKey(Plat, on_delete=models.CASCADE, null=True, blank=True)
    personnalisation = models.ForeignKey(Personnalisation, on_delete=models.CASCADE, null=True, blank=True)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=6, decimal_places=2)