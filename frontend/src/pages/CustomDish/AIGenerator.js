import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMagic, FaSpinner, FaCheck, FaFire, FaDumbbell, FaLeaf, FaClock } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { aiAPI, dishesAPI, customDishAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const AIGenerator = () => {
  const { isAuthenticated } = useAuth();
  const [description, setDescription] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedDish, setGeneratedDish] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await dishesAPI.getAll();
      // Extract unique ingredients from dishes
      const allIngredients = new Set();
      (response.data || []).forEach(dish => {
        if (dish.ingredients && Array.isArray(dish.ingredients)) {
          dish.ingredients.forEach(ing => {
            allIngredients.add(JSON.stringify({ id: ing.id, name: ing.name }));
          });
        }
      });
      const uniqueIngredients = Array.from(allIngredients).map(item => JSON.parse(item));
      setIngredients(uniqueIngredients);
    } catch (error) {
      console.error('Erreur chargement ingrédients:', error);
      setIngredients([]);
    } finally {
      setLoadingIngredients(false);
    }
  };

  const handleGenerateDish = async () => {
    if (!description.trim()) {
      toast.error('Décrivez votre plat souhaité');
      return;
    }

    if (description.trim().length < 10) {
      toast.error('Description trop courte (minimum 10 caractères)');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAPI.generateDish(
        description,
        selectedIngredients,
        false // Ne pas sauvegarder automatiquement
      );

      setGeneratedDish(response.data.dish);
      toast.success('Plat généré avec succès! 🎉');
    } catch (error) {
      console.error('Erreur génération:', error);
      const errorMsg = error.response?.data?.error || 'Erreur lors de la génération';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDish = async () => {
    if (!generatedDish) return;

    setSaving(true);
    try {
      await aiAPI.generateDish(
        description,
        selectedIngredients,
        true // Sauvegarder cette fois
      );
      toast.success('Plat sauvegardé! ✅');
      // Reset
      setDescription('');
      setSelectedIngredients([]);
      setGeneratedDish(null);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleIngredient = (ingredientId) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaMagic className="text-4xl text-indigo-600" />
            <h1 className="text-5xl font-bold text-gray-800 dark:text-white">
              Générateur de Plats IA
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Décrivez votre plat idéal et laissez l'IA créer une recette personnalisée
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Description Textarea */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <label className="block text-lg font-semibold text-gray-800 dark:text-white mb-3">
                📝 Décrivez votre plat idéal
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Je veux un plat riche en protéines, épicé, avec du poulet, sans gluten, facile à préparer..."
                className="w-full h-32 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:outline-none dark:bg-gray-700 dark:text-white resize-none"
                disabled={loading}
              />
              <p className="text-sm text-gray-500 mt-2">
                {description.length}/500 caractères
              </p>
            </div>

            {/* Ingredients Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <label className="block text-lg font-semibold text-gray-800 dark:text-white mb-4">
                🥕 Ingrédients (optionnel)
              </label>
              {loadingIngredients ? (
                <div className="text-center py-4">
                  <FaSpinner className="animate-spin text-2xl text-indigo-600 mx-auto" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {ingredients.map((ingredient) => (
                    <button
                      key={ingredient.id}
                      onClick={() => toggleIngredient(ingredient.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedIngredients.includes(ingredient.id)
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                      disabled={loading}
                    >
                      <div className="font-medium text-gray-800 dark:text-white">
                        {selectedIngredients.includes(ingredient.id) && (
                          <FaCheck className="inline mr-2 text-indigo-600" />
                        )}
                        {ingredient.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ingredient.calories_kcal_100g} cal/100g
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedIngredients.length > 0 && (
                <p className="text-sm text-indigo-600 mt-3">
                  {selectedIngredients.length} ingrédient(s) sélectionné(s)
                </p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateDish}
              disabled={loading || !description.trim()}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                loading || !description.trim()
                  ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg transform hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FaMagic />
                  Générer mon plat
                </>
              )}
            </button>
          </motion.div>

          {/* Right: Preview */}
          {generatedDish ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Dish Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                {/* Placeholder image */}
                <div className="w-full h-48 bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center">
                  <FaLeaf className="text-6xl text-white opacity-30" />
                </div>

                <div className="p-8">
                  <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    {generatedDish.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {generatedDish.description}
                  </p>

                  {/* Nutrition Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-1">
                        <FaFire />
                        <span className="font-semibold">Calories</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {generatedDish.nutrition.calories} kcal
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <FaDumbbell />
                        <span className="font-semibold">Protéines</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {parseFloat(generatedDish.nutrition.protein_g).toFixed(1)}g
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-1">
                        <span className="font-semibold">Glucides</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {parseFloat(generatedDish.nutrition.carbs_g).toFixed(1)}g
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                        <span className="font-semibold">Lipides</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800 dark:text-white">
                        {parseFloat(generatedDish.nutrition.fat_g).toFixed(1)}g
                      </div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex gap-4 mb-6 text-sm text-gray-600 dark:text-gray-400">
                    {generatedDish.prep_time_minutes && (
                      <div className="flex items-center gap-1">
                        <FaClock /> {generatedDish.prep_time_minutes} min
                      </div>
                    )}
                    {generatedDish.difficulty && (
                      <div>Difficulté: {generatedDish.difficulty}</div>
                    )}
                  </div>

                  {/* Ingredients */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                      Ingrédients:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {generatedDish.ingredients.map((ing, idx) => (
                        <li key={idx}>
                          {ing.name} ({ing.quantity})
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                      Mode de préparation:
                    </h3>
                    <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-sm">
                      {generatedDish.instructions}
                    </div>
                  </div>

                  {/* Save Button */}
                  {isAuthenticated ? (
                    <button
                      onClick={handleSaveDish}
                      disabled={saving}
                      className={`w-full py-3 px-4 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                        saving
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {saving ? (
                        <>
                          <FaSpinner className="animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          Sauvegarder ce plat
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center text-gray-600 dark:text-gray-400">
                      Connectez-vous pour sauvegarder ce plat
                    </div>
                  )}
                </div>
              </div>

              {/* Generate Another Button */}
              <button
                onClick={() => setGeneratedDish(null)}
                className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Générer un autre plat
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
                <FaMagic className="text-6xl text-indigo-600 mx-auto mb-4 opacity-30" />
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  👈 Remplissez le formulaire et générez votre plat personnalisé!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;
