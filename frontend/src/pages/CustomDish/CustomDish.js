import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaCheckCircle,
  FaClock,
  FaDumbbell,
  FaExclamationTriangle,
  FaFire,
  FaLeaf,
  FaMagic,
  FaShoppingCart,
  FaSpinner,
  FaTimes,
  FaUtensils,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import { aiAPI, customDishAPI, dishesAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { computeComponentSignals, useFoodProfile } from '../../hooks/useFoodProfile';


const PREPARATION_FEE = 50;
const DEFAULT_BASE_DISH_ID = 1;

const formatDishPrice = (value) => {
  const numericValue = Number(value || 0);
  return numericValue > 0 ? `${numericValue.toFixed(0)} DH` : '0 DH';
};

const PriceHighlight = ({ label = 'Prix du plat', value, description = '' }) => (
  <div className="overflow-hidden rounded-lg border-2 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
    <div className="flex items-center justify-between bg-gradient-to-r from-green-100 to-transparent p-3 dark:from-green-900/30">
      <span className="text-lg font-bold text-green-600 dark:text-green-400">{label}</span>
      <span className="text-2xl font-bold text-primary">{formatDishPrice(value)}</span>
    </div>
    {description ? (
      <div className="border-t border-green-200 px-3 py-2 text-xs text-gray-600 dark:border-green-800 dark:text-gray-400">
        {description}
      </div>
    ) : null}
  </div>
);


const CustomDish = () => {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const foodProfile = useFoodProfile();

  const [groups, setGroups] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedDishes, setSavedDishes] = useState([]);
  const [aiDescription, setAiDescription] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatedDish, setGeneratedDish] = useState(null);
  const [detailDish, setDetailDish] = useState(null);
  const [baseDishPrice, setBaseDishPrice] = useState(0);
  const detailSectionRef = useRef(null);

  useEffect(() => {
    fetchComponents();
    fetchSavedDishes();
    fetchBaseDishPrice();
  }, []);

  useEffect(() => {
    if (!detailDish || !detailSectionRef.current) {
      return;
    }

    requestAnimationFrame(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [detailDish]);

  const fetchComponents = async () => {
    try {
      const response = await customDishAPI.getAvailableComponents();
      setGroups(response.data || []);
    } catch (error) {
      console.error('Erreur chargement composants', error);
      setGroups([]);
      toast.error('Erreur lors du chargement des composants');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedDishes = async () => {
    try {
      const response = await customDishAPI.getAll();
      const dishes = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
          ? response.data.results
          : [];
      setSavedDishes(dishes);
    } catch (error) {
      console.error('Erreur chargement plats sauvegardes', error);
      setSavedDishes([]);
    }
  };

  const fetchBaseDishPrice = async () => {
    try {
      const response = await dishesAPI.getById(DEFAULT_BASE_DISH_ID);
      const price = Number(response.data?.base_price || 0);
      setBaseDishPrice(price);
    } catch (error) {
      console.error('Erreur chargement prix plat de base', error);
      setBaseDishPrice(0);
    }
  };

  const handleSelectComponent = (groupName, component) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [groupName]: component,
    }));
    setGeneratedDish(null);
  };

  const selectedComponentList = useMemo(() => Object.values(selectedComponents), [selectedComponents]);
  const selectedComponentIds = useMemo(
    () => selectedComponentList.map((component) => component.id),
    [selectedComponentList]
  );

  const totals = useMemo(() => {
    let calories = 0;
    let proteins = 0;
    let carbs = 0;
    let fats = 0;
    // Prix total = Prix plat de base + Frais préparation (50) + Prix des composants
    let price = baseDishPrice + PREPARATION_FEE;

    selectedComponentList.forEach((component) => {
      calories += Number(component.calories_kcal || component.calories || 0);
      proteins += Number(component.protein_g || component.proteins || 0);
      carbs += Number(component.carbs_g || component.carbs || 0);
      fats += Number(component.fat_g || component.fats || 0);
      // Ajouter le prix/delta du composant
      price += Number(component.price_delta || component.price || 0);
    });

    return {
      calories,
      proteins,
      carbs,
      fats,
      price,
    };
  }, [selectedComponentList, baseDishPrice]);

  const componentSignals = useMemo(
    () => computeComponentSignals(selectedComponentList, foodProfile),
    [selectedComponentList, foodProfile]
  );

  const buildPayload = () => ({
    base_dish_id: DEFAULT_BASE_DISH_ID,
    title: generatedDish?.name || 'Mon plat personnalise',
    notes: generatedDish?.description || aiDescription || '',
    image_url: generatedDish?.image_url || '',
    components: selectedComponentIds,
    save_to_profile: false,
  });

  const handleAddToCart = async (dish = null, isSavedDish = false) => {
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour passer une commande');
      return;
    }

    try {
      if (isSavedDish && dish) {
        await addItem({ custom_dish_id: dish.id, quantity: 1 });
        toast.success('Plat ajoute au panier');
        return;
      }

      if (selectedComponentIds.length === 0) {
        toast.error('Selectionnez au moins un composant');
        return;
      }

      const temporaryDishResponse = await customDishAPI.create(buildPayload());
      await addItem({ custom_dish_id: temporaryDishResponse.data.id, quantity: 1 });
      toast.success('Plat personnalise ajoute au panier');
    } catch (error) {
      console.error('Cart error:', error);
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  const handleGenerateAIDish = async () => {
    if (selectedComponentIds.length === 0) {
      toast.error("Selectionnez au moins un ingredient avant de lancer l'IA");
      return;
    }

    setGeneratingAI(true);
    try {
      const ingredientIds = selectedComponentList
        .map((component) => component.ingredient || component.ingredient_details?.id)
        .filter(Boolean);

      const response = await aiAPI.generateDish({
        description: aiDescription,
        component_ids: selectedComponentIds,
        ingredients: ingredientIds,
        save_dish: false,
      });

      const nextDish = response.data?.dish || null;
      setGeneratedDish(nextDish);
      toast.success('Plat genere avec succes !');
    } catch (error) {
      console.error('Erreur generation IA:', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-4 text-center text-4xl font-bold text-gray-800 dark:text-white">
        Creez votre plat personnalise
      </h1>
      <p className="mb-12 text-center text-gray-600 dark:text-gray-400">
        Choisissez vos ingredients, puis laissez l IA transformer votre selection en plat complet.
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800"
              >
                <h3 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">{group.name}</h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {(group.items || []).map((choice) => (
                    <button
                      key={choice.id}
                      onClick={() => handleSelectComponent(group.name, choice)}
                      className={`rounded-lg border-2 p-3 transition-all ${
                        selectedComponents[group.name]?.id === choice.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-primary dark:border-gray-700'
                      }`}
                    >
                      <div className="font-medium text-gray-800 dark:text-white">{choice.name}</div>
                      <div className="text-sm text-gray-500">
                        {choice.calories_kcal || choice.calories || 0} cal | {choice.protein_g || choice.proteins || 0}g prot
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
            <h3 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-800 dark:text-white">
              <FaUtensils className="text-primary" />
              Votre plat
            </h3>

            <div className="mb-6 max-h-48 space-y-3 overflow-y-auto">
              {selectedComponentList.length > 0 ? (
                Object.entries(selectedComponents).map(([groupName, component]) => (
                  <motion.div
                    key={groupName}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50"
                  >
                    <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{groupName}</div>
                    <div className="font-medium text-gray-800 dark:text-white">{component.name}</div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm italic text-gray-500 dark:text-gray-400">
                  Selectionnez vos ingredients pour commencer
                </p>
              )}
            </div>

            {componentSignals.matchedDiets.length ? (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-semibold">
                  <FaCheckCircle />
                  <span>✅ Ce plat correspond a votre regime alimentaire</span>
                </div>
                <div className="mt-1">{componentSignals.matchedDiets.join(' • ')}</div>
              </div>
            ) : null}

            {componentSignals.matchedAllergens.length ? (
              <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                <div className="flex items-center gap-2 font-semibold">
                  <FaExclamationTriangle />
                  <span>
                    ⚠️ Attention : votre composition contient {componentSignals.matchedAllergens.join(', ')}.
                  </span>
                </div>
              </div>
            ) : null}

            <div className="mb-6 space-y-3 border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <span className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
                  <FaFire />
                  Calories
                </span>
                <span className="text-xl font-bold text-gray-800 dark:text-white">{totals.calories} kcal</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <span className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400">
                  <FaDumbbell />
                  Proteines
                </span>
                <span className="text-xl font-bold text-gray-800 dark:text-white">{totals.proteins.toFixed(1)} g</span>
              </div>
              <PriceHighlight
                label="Prix du plat"
                value={totals.price}
                description="Inclut le plat de base, vos composants et 50 DH de preparation."
              />
            </div>

            <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
              <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-white">
                <FaMagic className="text-primary" />
                <span>Assistant IA</span>
              </div>
              <textarea
                value={aiDescription}
                onChange={(event) => setAiDescription(event.target.value)}
                placeholder="Ex: Je veux un plat riche en proteines, epice, avec du poulet et faible en calories"
                className="min-h-[120px] w-full resize-none rounded-lg border border-gray-200 p-3 text-sm text-gray-700 focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                disabled={generatingAI}
              />
              <button
                onClick={handleGenerateAIDish}
                disabled={generatingAI || selectedComponentIds.length === 0}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all ${
                  generatingAI || selectedComponentIds.length === 0
                    ? 'cursor-not-allowed bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:shadow-lg'
                }`}
              >
                {generatingAI ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Generation en cours...
                  </>
                ) : (
                  <>
                    <FaMagic />
                    {generatedDish ? 'Regenerer mon plat avec IA' : 'Generer mon plat avec IA'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {generatedDish ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-12 overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800"
        >
          {generatedDish.image_url ? (
            <img src={generatedDish.image_url} alt={generatedDish.name || 'Plat genere'} className="h-64 w-full object-cover" />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-orange-400 to-primary">
              <FaLeaf className="text-6xl text-white/70" />
            </div>
          )}

          <div className="p-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <FaMagic />
                Suggestion IA
              </div>
              <button
                onClick={() => handleAddToCart()}
                disabled={selectedComponentIds.length === 0}
                className="rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaShoppingCart className="text-primary" />
              </button>
            </div>

            <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">{generatedDish.name}</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">{generatedDish.description}</p>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-900/20">
                <div className="mb-1 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <FaFire />
                  <span className="font-semibold">Calories</span>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {generatedDish.nutrition?.calories || totals.calories} kcal
                </div>
              </div>

              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-900/20">
                <div className="mb-1 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <FaDumbbell />
                  <span className="font-semibold">Proteines</span>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {Number(generatedDish.nutrition?.protein_g || totals.proteins).toFixed(1)}g
                </div>
              </div>

              <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20">
                <div className="mb-1 text-yellow-600 dark:text-yellow-400">
                  <span className="font-semibold">Glucides</span>
                </div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {Number(generatedDish.nutrition?.carbs_g || totals.carbs).toFixed(1)}g
                </div>
              </div>
            </div>

            <div className="mb-8">
              <PriceHighlight
                label="Prix du plat"
                value={totals.price}
                description="Inclut le plat de base, vos composants choisis et 50 DH de preparation."
              />
            </div>

            {componentSignals.matchedDiets.length ? (
              <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
                ✅ Compatible avec votre regime : {componentSignals.matchedDiets.join(' • ')}
              </div>
            ) : null}

            {componentSignals.matchedAllergens.length ? (
              <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                ⚠️ Allergies detectees : {componentSignals.matchedAllergens.join(', ')}
              </div>
            ) : null}

            <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              {generatedDish.prep_time_minutes ? (
                <div className="flex items-center gap-1">
                  <FaClock />
                  {generatedDish.prep_time_minutes} min
                </div>
              ) : null}
              {generatedDish.difficulty ? <div>Difficulte: {generatedDish.difficulty}</div> : null}
            </div>

            <div className="mb-6">
              <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Ingredients utilises</h3>
              {generatedDish.ingredients?.length > 0 ? (
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  {generatedDish.ingredients.map((ingredient, index) => (
                    <li key={`${ingredient.name || 'ingredient'}-${index}`} className="flex justify-between gap-4">
                      <span>{ingredient.name || 'Ingredient'}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{ingredient.quantity || 'Quantite libre'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune liste d ingredients retournee.</p>
              )}
            </div>

            <div className="mb-8">
              <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">Instructions</h3>
              <div className="whitespace-pre-line rounded-lg bg-gray-50 p-4 text-sm text-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                {generatedDish.instructions || 'Instructions indisponibles pour le moment.'}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={() => handleAddToCart()}
                disabled={selectedComponentIds.length === 0}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                <FaShoppingCart />
                Commander ce plat
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-12">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-800 dark:text-white">Mes plats personnalises</h2>
          <p className="text-gray-600 dark:text-gray-400">Vos creations sauvegardees, pretes a commander</p>
        </div>

        {!savedDishes.length ? (
          <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-12 text-center dark:from-gray-800 dark:to-gray-900">
            <FaUtensils className="mx-auto mb-4 text-5xl text-gray-300 dark:text-gray-600" />
            <p className="mb-2 text-lg text-gray-600 dark:text-gray-400">Aucun plat sauvegarde pour le moment</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Vos creations sauvegardees apparaissent ici automatiquement des qu elles existent dans votre compte.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {savedDishes.map((dish) => (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group overflow-hidden rounded-xl bg-white shadow-md transition hover:shadow-lg dark:bg-gray-800"
              >
                <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 to-orange-400/20">
                  {dish.image_url ? (
                    <img src={dish.image_url} alt={dish.title} className="h-full w-full object-cover transition group-hover:scale-110" />
                  ) : (
                    <FaUtensils className="text-4xl text-primary/40 transition group-hover:scale-110" />
                  )}
                  <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-sm font-bold text-white">⭐ Favori</div>
                </div>

                <div className="p-5">
                  <h3 className="mb-3 line-clamp-2 text-lg font-bold text-gray-800 dark:text-white">
                    {dish.title || 'Plat personnalise'}
                  </h3>

                  <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{dish.calories_kcal || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">kcal</div>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{dish.protein_g || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">g prot</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{dish.total_price || 50}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">DH</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(dish, true)}
                    className="mb-2 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-white transition hover:bg-primary-dark"
                  >
                    <FaShoppingCart className="text-sm" />
                    Commander
                  </button>
                  <button
                    onClick={() => setDetailDish(dish)}
                    className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
                  >
                    Voir details
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {detailDish ? (
        <div ref={detailSectionRef} className="mx-auto mt-12 w-full max-w-4xl scroll-mt-32">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/78"
          >
            <div className="p-6 sm:p-8">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {detailDish.title || 'Plat personnalise'}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600 dark:text-gray-300">
                    {detailDish.notes || 'Creation Fit Feast personnalisee'}
                  </p>
                </div>
                <button
                  onClick={() => setDetailDish(null)}
                  className="shrink-0 rounded-full p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Fermer les details"
                >
                  <FaTimes />
                </button>
              </div>

              {detailDish.image_url ? (
                <img
                  src={detailDish.image_url}
                  alt={detailDish.title}
                  className="mb-6 h-48 w-full rounded-[22px] object-cover sm:h-64"
                />
              ) : null}

              <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                  <div className="text-xs text-red-600 dark:text-red-400">Calories</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{detailDish.calories_kcal || 0}</div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Proteines</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{detailDish.protein_g || 0}</div>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Glucides</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{detailDish.carbs_g || 0}</div>
                </div>
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <div className="text-xs text-green-600 dark:text-green-400">Prix</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{detailDish.total_price || 50} DH</div>
                </div>
              </div>

              {detailDish.components_details?.length ? (
                <div className="mb-6">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Composants</h4>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {detailDish.components_details.map((component) => (
                      <li
                        key={component.id}
                        className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {component.component_name}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <button
                onClick={() => handleAddToCart(detailDish, true)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
              >
                <FaShoppingCart />
                Ajouter au panier
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
};


export default CustomDish;
