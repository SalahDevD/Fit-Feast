import { useEffect, useMemo, useState } from 'react';

import { allergiesAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';


const normalizeLabel = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();


const ALLERGEN_KEYWORDS = {
  Gluten: ['gluten', 'pain', 'wrap', 'pates', 'pate', 'pasta', 'semoule', 'farine', 'granola', 'speculoos'],
  Lactose: ['lait', 'fromage', 'yaourt', 'yogurt', 'beurre', 'cream', 'creme', 'whey', 'skyr'],
  Oeufs: ['oeuf', 'oeufs', 'omelette'],
  Poisson: ['poisson', 'saumon', 'thon', 'fish'],
  Crustaces: ['crevette', 'shrimp', 'crab', 'crustace'],
  Soja: ['soja', 'soy', 'tofu', 'teriyaki'],
  Arachides: ['arachide', 'cacahuete', 'peanut'],
  'Fruits a coque': ['amande', 'amandes', 'noix', 'cajou', 'hazelnut', 'pistache'],
};


const normalizeAllergenName = (name) => {
  const mapping = {
    gluten: 'Gluten',
    lactose: 'Lactose',
    oeufs: 'Oeufs',
    oeuf: 'Oeufs',
    poisson: 'Poisson',
    crustaces: 'Crustaces',
    soja: 'Soja',
    arachides: 'Arachides',
    'fruits a coque': 'Fruits a coque',
  };
  return mapping[normalizeLabel(name)] || name;
};


export const computeComponentSignals = (components = [], profile = { allergies: [], diets: [] }) => {
  const ingredientNames = components
    .flatMap((component) => [
      component?.name,
      component?.ingredient_details?.name,
      ...(component?.ingredient_details?.allergen_names || []),
    ])
    .filter(Boolean);

  const textBlob = normalizeLabel(ingredientNames.join(' '));

  const allergenSet = new Set(
    components.flatMap((component) => {
      const names = component?.ingredient_details?.allergen_names || [];
      return names.map(normalizeAllergenName);
    })
  );

  Object.entries(ALLERGEN_KEYWORDS).forEach(([allergenName, keywords]) => {
    if (keywords.some((keyword) => textBlob.includes(keyword))) {
      allergenSet.add(allergenName);
    }
  });

  const allergens = Array.from(allergenSet);
  const matchedAllergens = allergens.filter((name) =>
    profile.allergies.some((userAllergy) => normalizeLabel(userAllergy) === normalizeLabel(name))
  );

  const hasMeat = ['poulet', 'boeuf', 'beef', 'viande', 'steak'].some((keyword) => textBlob.includes(keyword));
  const hasFish = ['poisson', 'saumon', 'thon', 'fish'].some((keyword) => textBlob.includes(keyword));
  const hasEggs = ['oeuf', 'oeufs', 'omelette'].some((keyword) => textBlob.includes(keyword));
  const hasDairy = ['lait', 'fromage', 'yaourt', 'yogurt', 'beurre', 'whey', 'skyr'].some((keyword) =>
    textBlob.includes(keyword)
  );
  const hasGluten = ['gluten', 'pain', 'wrap', 'pates', 'pasta', 'semoule', 'farine', 'granola'].some((keyword) =>
    textBlob.includes(keyword)
  );

  const compatibleDiets = [];
  if (!hasMeat && !hasFish) compatibleDiets.push('Vegetarien');
  if (!hasMeat && !hasFish && !hasEggs && !hasDairy) compatibleDiets.push('Vegan');
  if (!hasGluten) compatibleDiets.push('Sans gluten');
  if (!hasDairy) compatibleDiets.push('Sans lactose');

  const matchedDiets = compatibleDiets.filter((diet) =>
    profile.diets.some((userDiet) => normalizeLabel(userDiet) === normalizeLabel(diet))
  );

  return {
    allergens,
    matchedAllergens,
    compatibleDiets,
    matchedDiets,
  };
};


export const useFoodProfile = () => {
  const { isAuthenticated } = useAuth();
  const [allergies, setAllergies] = useState([]);
  const [diets, setDiets] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAllergies([]);
      setDiets([]);
      return;
    }

    const loadProfile = async () => {
      try {
        const [allergiesResponse, dietsResponse] = await Promise.all([
          allergiesAPI.getUserAllergies(),
          allergiesAPI.getUserDiets(),
        ]);

        const allergyRows = Array.isArray(allergiesResponse.data)
          ? allergiesResponse.data
          : allergiesResponse.data?.results || [];
        const dietRows = Array.isArray(dietsResponse.data) ? dietsResponse.data : dietsResponse.data?.results || [];

        setAllergies(allergyRows.map((item) => item.allergen_name).filter(Boolean));
        setDiets(dietRows.map((item) => item.diet_name).filter(Boolean));
      } catch {
        setAllergies([]);
        setDiets([]);
      }
    };

    loadProfile();
  }, [isAuthenticated]);

  return useMemo(() => ({ allergies, diets }), [allergies, diets]);
};
