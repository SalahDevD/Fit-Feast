import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaAppleWhole,
  FaArrowLeft,
  FaArrowRight,
  FaBasketShopping,
  FaCheck,
  FaCirclePlus,
  FaClock,
  FaMugHot,
  FaFire,
  FaMagnifyingGlass,
  FaTrashCan,
  FaUtensils,
} from 'react-icons/fa6';
import { addDays, format, startOfWeek } from 'date-fns';
import toast from 'react-hot-toast';

import { dishesAPI, mealPrepAPI } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Breakfast', icon: FaMugHot, accent: 'text-amber-500' },
  { value: 'LUNCH', label: 'Lunch', icon: FaUtensils, accent: 'text-emerald-500' },
  { value: 'DINNER', label: 'Dinner', icon: FaBasketShopping, accent: 'text-sky-500' },
  { value: 'SNACK', label: 'Snack', icon: FaAppleWhole, accent: 'text-rose-500' },
];

const TOTAL_SLOTS = WEEK_DAYS.length * MEAL_TYPES.length;
const formatWeekKey = (date) => format(date, 'yyyy-MM-dd');

const formatMetricNumber = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(1);
};

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return null;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MAD',
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const extractMealContent = (item) => {
  if (!item) {
    return null;
  }

  const dishDetails = item.dish_details || item.custom_dish_details || {};

  return {
    name: item.item_name || dishDetails.name || dishDetails.title || 'Planned meal',
    calories: dishDetails.calories ?? dishDetails.calories_kcal ?? null,
    proteins: dishDetails.proteins ?? dishDetails.protein_g ?? null,
    price: dishDetails.price ?? dishDetails.base_price ?? null,
    preparationTime: dishDetails.preparation_time ?? null,
    imageUrl: dishDetails.image_url || dishDetails.image || null,
    category: dishDetails.category_name || 'Fit Feast selection',
    dietMatches: dishDetails.profile_diet_matches || [],
    allergenMessage: dishDetails.profile_allergen_message || '',
  };
};

const MealPrep = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshCount, addItem } = useCart();
  const [mealPlan, setMealPlan] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopping, setShopping] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);
  const [searchDish, setSearchDish] = useState('');
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  useEffect(() => {
    const loadStaticData = async () => {
      try {
        const dishesResponse = await dishesAPI.getAll();
        setDishes(dishesResponse.data.results || dishesResponse.data || []);
      } catch (error) {
        console.error('Meal prep dish loading error', error);
        setDishes([]);
      }
    };

    loadStaticData();
  }, []);

  useEffect(() => {
    const loadMealPlan = async () => {
      setLoading(true);

      try {
        const response = await mealPrepAPI.getByWeek(formatWeekKey(currentWeekStart));
        setMealPlan(response.data ?? null);
      } catch (error) {
        console.error('Meal prep plan loading error', error);
        setMealPlan(null);
      } finally {
        setLoading(false);
      }
    };

    loadMealPlan();
  }, [currentWeekStart]);

  const closeModal = () => {
    setShowAddModal(false);
    setSelectedDay(null);
    setSelectedMealType(null);
    setSelectedDish(null);
    setSearchDish('');
  };

  const refreshCurrentWeekPlan = async () => {
    try {
      const response = await mealPrepAPI.getByWeek(formatWeekKey(currentWeekStart));
      setMealPlan(response.data ?? null);
    } catch (error) {
      console.error('Meal prep refresh error', error);
      setMealPlan(null);
    }
  };

  const openAddModal = (dayIndex, mealType) => {
    setSelectedDay(dayIndex);
    setSelectedMealType(mealType);
    setSelectedDish(null);
    setSearchDish('');
    setShowAddModal(true);
  };

  const getDayDate = (dayIndex) => addDays(currentWeekStart, dayIndex);

  const getMealItem = (dayIndex, mealType) => {
    if (!mealPlan?.items?.length) {
      return null;
    }

    const targetDay = format(getDayDate(dayIndex), 'yyyy-MM-dd');
    return (
      mealPlan.items.find((item) => item.day === targetDay && item.meal_type === mealType) || null
    );
  };

  const addToPlan = async () => {
    if (selectedDay === null || !selectedMealType || !selectedDish) {
      return;
    }

    setSaving(true);

    try {
      const selectedDate = format(getDayDate(selectedDay), 'yyyy-MM-dd');

      if (mealPlan?.id) {
        await mealPrepAPI.addItem(mealPlan.id, {
          day: selectedDate,
          meal_type: selectedMealType,
          dish_id: selectedDish.id,
          notes: `Meal prep ${selectedDish.name}`,
        });
      } else {
        await mealPrepAPI.create({
          week_start_date: formatWeekKey(currentWeekStart),
          items: [
            {
              day: selectedDate,
              meal_type: selectedMealType,
              dish_id: selectedDish.id,
              notes: `Meal prep ${selectedDish.name}`,
            },
          ],
        });
      }

      toast.success('Meal added to your plan.');
      await refreshCurrentWeekPlan();
      closeModal();
    } catch (error) {
      console.error('Meal prep add error', error);
      toast.error('The meal could not be added.');
    } finally {
      setSaving(false);
    }
  };

  const removeFromPlan = async (itemId) => {
    if (!mealPlan?.id) {
      return;
    }

    try {
      await mealPrepAPI.removeItem(mealPlan.id, itemId);
      toast.success('Meal removed from your plan.');
      await refreshCurrentWeekPlan();
    } catch (error) {
      console.error('Meal prep remove error', error);
      toast.error('The meal could not be removed.');
    }
  };

  const addAllToCart = async () => {
    if (!mealPlan?.items?.length) {
      toast.error('Add a few meals to your week first.');
      return;
    }

    setShopping(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const item of mealPlan.items) {
        try {
          if (item.dish) {
            await addItem({ dish_id: item.dish, quantity: 1 });
            successCount += 1;
          } else if (item.custom_dish) {
            await addItem({ custom_dish_id: item.custom_dish, quantity: 1 });
            successCount += 1;
          } else {
            failCount += 1;
          }
        } catch (error) {
          console.error('Meal prep cart sync error', error);
          failCount += 1;
        }
      }

      await refreshCount();

      if (successCount > 0) {
        toast.success(`${successCount} meal${successCount === 1 ? '' : 's'} added to your cart.`);
        navigate('/cart');
      }

      if (failCount > 0) {
        toast.error(`${failCount} meal${failCount === 1 ? '' : 's'} could not be added.`);
      }
    } finally {
      setShopping(false);
    }
  };

  const filteredDishes = useMemo(
    () =>
      dishes
        .filter((dish) => dish.is_available !== false)
        .filter((dish) => {
          const haystack = `${dish.name || ''} ${dish.category_name || ''}`.toLowerCase();
          return haystack.includes(searchDish.toLowerCase());
        })
        .slice(0, 12),
    [dishes, searchDish]
  );

  const plannedMealsCount = mealPlan?.items?.length || 0;
  const completionRate = Math.round((plannedMealsCount / TOTAL_SLOTS) * 100);
  const selectedMealTypeConfig = MEAL_TYPES.find((meal) => meal.value === selectedMealType);
  const weekEnd = addDays(currentWeekStart, 6);
  const currentWeekKey = formatWeekKey(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const isCurrentWeek = formatWeekKey(currentWeekStart) === currentWeekKey;

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="ff-panel--dark overflow-hidden rounded-[2.75rem] px-6 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr] xl:items-end">
            <div>
              <p className="ff-eyebrow text-emerald-300">
                <FaBasketShopping />
                Weekly planning
              </p>
              <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
                Build your week once, then turn it into an order in one move.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Plan meals across every day, keep nutrition context visible, and convert your full
                week into a ready-to-order cart whenever you are set.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.7rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:backdrop-blur dark:shadow-none">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-200">Week</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:backdrop-blur dark:shadow-none">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-200">Progress</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {plannedMealsCount}/{TOTAL_SLOTS} meals
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-slate-200/80 bg-white p-4 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:backdrop-blur dark:shadow-none">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-200">Catalog</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{dishes.length} available dishes</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-[2rem] border border-slate-200/80 bg-white p-5 text-slate-900 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentWeekStart((previous) => addDays(previous, -7))}
                  className="ff-icon-button border-black/10 bg-black text-white hover:border-black/20 hover:bg-slate-800 hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white"
                  aria-label="Previous week"
                >
                  <FaArrowLeft />
                </button>

                <div className="text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-200">Schedule range</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                    {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentWeekStart((previous) => addDays(previous, 7))}
                  className="ff-icon-button border-black/10 bg-black text-white hover:border-black/20 hover:bg-slate-800 hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white"
                  aria-label="Next week"
                >
                  <FaArrowRight />
                </button>
              </div>

              {!isCurrentWeek ? (
                <button
                  type="button"
                  className="ff-button-secondary w-full border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200 hover:text-slate-900 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
                  onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                >
                  Back to this week
                </button>
              ) : null}

              <button
                type="button"
                className="ff-button-primary w-full"
                onClick={addAllToCart}
                disabled={shopping || plannedMealsCount === 0}
              >
                <FaBasketShopping />
                {shopping ? 'Adding meals...' : 'Send this week to cart'}
              </button>

              <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-100/90 p-4 dark:border-white/10 dark:bg-slate-950/30">
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                  <span>Completion</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{completionRate}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300 transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  {user?.username ? `${user.username}, y` : 'Y'}ou are {plannedMealsCount > 0 ? 'already building momentum.' : 'one click away from filling your week.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="ff-panel ff-panel--strong rounded-[2.5rem] p-6 sm:p-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="ff-eyebrow">Planner board</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
                Assign meals to each day and meal type
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                Each slot keeps nutrition context, prep time, and dietary warnings visible.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="rounded-[1.8rem] border border-slate-200/80 bg-slate-50/80 p-5 dark:border-white/10 dark:bg-white/5">
                  <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200/80 dark:bg-white/10" />
                  <div className="mt-4 space-y-3">
                    {MEAL_TYPES.map((meal) => (
                      <div key={meal.value} className="h-16 animate-pulse rounded-[1.2rem] bg-slate-200/80 dark:bg-white/10" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {WEEK_DAYS.map((day, dayIndex) => (
                <article
                  key={day}
                  className="rounded-[1.8rem] border border-slate-200/80 bg-slate-50/80 p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.3)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900 dark:text-white">{day}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {format(getDayDate(dayIndex), 'MMM d')}
                      </p>
                    </div>
                    <span className="ff-chip text-xs">
                      {MEAL_TYPES.filter((meal) => getMealItem(dayIndex, meal.value)).length} planned
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {MEAL_TYPES.map((meal) => {
                      const Icon = meal.icon;
                      const item = getMealItem(dayIndex, meal.value);
                      const content = extractMealContent(item);

                      return (
                        <div
                          key={`${day}-${meal.value}`}
                          className={`rounded-[1.35rem] border p-4 transition ${
                            content
                              ? 'border-emerald-200 bg-white/90 shadow-sm dark:border-emerald-400/20 dark:bg-white/5'
                              : 'border-dashed border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 ${meal.accent}`}>
                              <Icon />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                {meal.label}
                              </p>
                              {content ? (
                                <>
                                  <p className="mt-2 truncate font-semibold text-slate-900 dark:text-white">
                                    {content.name}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    {content.calories ? (
                                      <span className="inline-flex items-center gap-1">
                                        <FaFire className="text-orange-500" />
                                        {content.calories} kcal
                                      </span>
                                    ) : null}
                                    {content.preparationTime ? (
                                      <span className="inline-flex items-center gap-1">
                                        <FaClock className="text-sky-500" />
                                        {content.preparationTime} min
                                      </span>
                                    ) : null}
                                  </div>
                                  {content.dietMatches?.length ? (
                                    <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                                      Matches: {content.dietMatches.join(', ')}
                                    </p>
                                  ) : null}
                                  {content.allergenMessage ? (
                                    <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                                      Warning: {content.allergenMessage}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                  No meal assigned yet.
                                </p>
                              )}
                            </div>

                            {content ? (
                              <button
                                type="button"
                                className="ff-icon-button h-10 w-10 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
                                onClick={() => removeFromPlan(item.id)}
                                aria-label={`Remove ${content.name}`}
                              >
                                <FaTrashCan />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="ff-icon-button h-10 w-10"
                                onClick={() => openAddModal(dayIndex, meal.value)}
                                aria-label={`Add a meal for ${meal.label}`}
                              >
                                <FaCirclePlus />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {showAddModal ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] flex items-center justify-center px-4 py-8"
          >
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={closeModal}
              aria-label="Close planner dialog"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              className="relative w-full max-w-4xl"
            >
              <div className="ff-panel ff-panel--strong overflow-hidden rounded-[2rem]">
                <div className="border-b border-slate-200/80 px-6 py-5 dark:border-white/10">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="ff-eyebrow">Add a meal</p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                        {selectedMealTypeConfig?.label} on{' '}
                        {selectedDay !== null ? WEEK_DAYS[selectedDay] : ''}
                      </h3>
                    </div>
                    <button type="button" onClick={closeModal} className="ff-icon-button h-11 w-11">
                      <FaCheck className="rotate-45 text-slate-500 dark:text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-6">
                  <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5">
                    <FaMagnifyingGlass className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search meals by name or category..."
                      value={searchDish}
                      onChange={(event) => setSearchDish(event.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {filteredDishes.length ? (
                      filteredDishes.map((dish) => {
                        const isSelected = selectedDish?.id === dish.id;
                        const formattedProteins = formatMetricNumber(dish.proteins);
                        const formattedPrice = formatPrice(dish.price);

                        return (
                          <button
                            key={dish.id}
                            type="button"
                            onClick={() => setSelectedDish(dish)}
                            className={`rounded-[1.6rem] border p-4 text-left transition ${
                              isSelected
                                ? 'border-emerald-300 bg-emerald-50/80 shadow-sm dark:border-emerald-400/30 dark:bg-emerald-400/10'
                                : 'border-slate-200 bg-white/90 hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                            }`}
                          >
                            <div className="flex gap-4">
                              <div className="h-20 w-20 overflow-hidden rounded-[1.2rem] bg-slate-100 dark:bg-white/10">
                                {dish.image_url ? (
                                  <img src={dish.image_url} alt={dish.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-slate-400">
                                    <FaUtensils />
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="truncate font-semibold text-slate-900 dark:text-white">
                                      {dish.name}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                      {dish.category_name || 'Fit Feast selection'}
                                    </p>
                                  </div>
                                  {isSelected ? <FaCheck className="text-emerald-500" /> : null}
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                  {dish.calories ? <span>{dish.calories} kcal</span> : null}
                                  {formattedProteins ? <span>{formattedProteins} g protein</span> : null}
                                  {dish.preparation_time ? <span>{dish.preparation_time} min</span> : null}
                                  {formattedPrice ? <span>{formattedPrice}</span> : null}
                                </div>

                                {dish.profile_diet_match ? (
                                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                                    Matches: {dish.profile_diet_matches?.join(', ')}
                                  </p>
                                ) : null}
                                {dish.profile_allergen_alert ? (
                                  <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-300">
                                    Warning: {dish.profile_allergen_message}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="md:col-span-2 rounded-[1.6rem] border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                        No meals match that search.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200/80 px-6 py-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" className="ff-button-secondary" onClick={closeModal}>
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="ff-button-primary"
                    onClick={addToPlan}
                    disabled={!selectedDish || saving}
                  >
                    <FaCirclePlus />
                    {saving ? 'Adding meal...' : 'Add to weekly plan'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default MealPrep;
