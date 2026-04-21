from django.db import models


class CategorieIngredient(models.Model):
    nom = models.CharField(max_length=100)
    
    def __str__(self):
        return self.nom


class Ingredient(models.Model):
    nom = models.CharField(max_length=150)
    id_categorie = models.ForeignKey(CategorieIngredient, on_delete=models.CASCADE)
    unite = models.CharField(max_length=50)
    
    def __str__(self):
        return self.nom


class Plat(models.Model):
    nom = models.CharField(max_length=150)
    description = models.TextField()
    prix = models.DecimalField(max_digits=8, decimal_places=2)
    calories = models.IntegerField()
    proteines = models.IntegerField()
    glucides = models.IntegerField()
    lipides = models.IntegerField()
    image = models.CharField(max_length=255)
    disponible = models.BooleanField(default=True)

    def __str__(self):
        return self.nom
