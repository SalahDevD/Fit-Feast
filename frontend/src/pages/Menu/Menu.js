import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaFireAlt,
  FaHeart,
  FaRedo,
  FaSearch,
  FaSlidersH,
  FaStar,
  FaWeightHanging,
} from 'react-icons/fa';

import EmptyState from '../../components/Common/EmptyState';
import InlineErrorState from '../../components/Feedback/InlineErrorState';
import PageSkeleton from '../../components/Feedback/PageSkeleton';
import { useAuth } from '../../context/AuthContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  useDishCategoriesQuery,
  useFavoriteDishesQuery,
  useMenuDishesQuery,
  useToggleFavoriteDishMutation,
} from '../../queries/useMenuQueries';
import { filterMenuDishes, sortMenuDishes } from '../../utils/menuFilters';
import DishCard from './DishCard';

const defaultFilters = {
  minPrice: '',
  maxPrice: '',
  minCalories: '',
  maxCalories: '',
  minProteins: '',
  maxProteins: '',
  sort: 'popular',
  favoritesOnly: false,
};

const getActiveFilterCount = ({ selectedCategory, filters }) =>
  [
    Boolean(selectedCategory),
    Boolean(filters.minPrice),
    Boolean(filters.maxPrice),
    Boolean(filters.minCalories),
    Boolean(filters.maxCalories),
    Boolean(filters.minProteins),
    Boolean(filters.maxProteins),
    Boolean(filters.favoritesOnly),
  ].filter(Boolean).length;

const quickFilterChips = [
  { label: 'Protein focus', updates: { minProteins: '25', sort: 'protein' } },
  { label: 'Under 60 MAD', updates: { maxPrice: '60', sort: 'price_asc' } },
  { label: 'Light meals', updates: { maxCalories: '450', sort: 'calories' } },
];

const Menu = () => {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(defaultFilters);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);
  const categoriesQuery = useDishCategoriesQuery();
  const dishesQuery = useMenuDishesQuery({
    category: selectedCategory,
    search: debouncedSearchQuery,
    filters: { favoritesOnly: filters.favoritesOnly },
  });
  const favoriteDishesQuery = useFavoriteDishesQuery(isAuthenticated);
  const toggleFavoriteMutation = useToggleFavoriteDishMutation();

  const categories = useMemo(() => categoriesQuery.data || [], [categoriesQuery.data]);
  const dishes = useMemo(() => dishesQuery.data || [], [dishesQuery.data]);
  const favoriteDishes = favoriteDishesQuery.data || [];
  const activeFilterCount = useMemo(
    () => getActiveFilterCount({ selectedCategory, filters }),
    [filters, selectedCategory]
  );
  const visibleDishes = useMemo(
    () => sortMenuDishes(filterMenuDishes(dishes, filters), filters.sort),
    [dishes, filters]
  );
  const isInitialLoading =
    (categoriesQuery.isPending && !categories.length) ||
    (dishesQuery.isPending && !dishes.length);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setFilters(defaultFilters);
  };

  const handleToggleFavorite = (dish) => {
    if (!isAuthenticated) {
      return;
    }

    toggleFavoriteMutation.mutate({
      dishId: dish.id,
      currentState: Boolean(dish.is_favorite),
      dishSnapshot: dish,
    });
  };

  if (isInitialLoading) {
    return <PageSkeleton variant="grid" />;
  }

  return (
    <div className="ff-page">
      <div className="ff-page__inner space-y-8">
        <section className="ff-panel--dark overflow-hidden rounded-[2.75rem] px-6 py-8 shadow-[0_32px_120px_-70px_rgba(15,23,42,0.85)] sm:px-8 sm:py-10">
          <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                Fit Feast menu
              </p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                Precision filters, premium visuals, instant reactions.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Search, sort, compare macros, and save favorites in real time without reloading the
                page.
              </p>
            </div>

            <div className="grid gap-3 rounded-[2rem] border border-slate-200/80 bg-white p-5 text-slate-900 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:backdrop-blur dark:shadow-none">
              <div className="flex items-center gap-3 rounded-full border border-black/10 bg-black px-4 py-3 text-white dark:border-white/10 dark:bg-slate-950/30">
                <FaSearch className="text-emerald-200" />
                <input
                  type="text"
                  placeholder="Search meals, categories, or keywords..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/60 dark:placeholder:text-white/55"
                />
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-white dark:border-white/10 dark:bg-white/10 dark:text-emerald-50/90">
                  <FaSlidersH />
                  {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
                </span>
                {dishesQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-white dark:border-white/10 dark:bg-white/10 dark:text-emerald-50/90">
                    Syncing results...
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-white dark:border-white/10 dark:bg-white/10 dark:text-emerald-50/90">
                  {visibleDishes.length} results
                </span>
                {isAuthenticated ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black px-4 py-2 text-white dark:border-white/10 dark:bg-white/10 dark:text-emerald-50/90">
                    <FaHeart className="text-rose-300" />
                    {favoriteDishes.length} saved
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {categoriesQuery.isError || dishesQuery.isError ? (
          <InlineErrorState
            title="The menu could not be loaded"
            description="A catalog request failed. Retry to refresh the latest dishes and filters."
            onRetry={() => {
              categoriesQuery.refetch();
              dishesQuery.refetch();
              favoriteDishesQuery.refetch?.();
            }}
          />
        ) : null}

        {isAuthenticated && favoriteDishes.length ? (
          <section className="ff-panel ff-panel--strong rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">
                  Your favorites
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Saved meals ready to reorder
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleFilterChange('favoritesOnly', !filters.favoritesOnly)}
                className={`ff-chip ${filters.favoritesOnly ? 'ff-chip--active' : ''}`}
              >
                <FaHeart />
                {filters.favoritesOnly ? 'Showing favorites only' : 'Filter to favorites'}
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {favoriteDishes.slice(0, 4).map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onToggleFavorite={handleToggleFavorite}
                  favoritePending={
                    toggleFavoriteMutation.isPending &&
                    toggleFavoriteMutation.variables?.dishId === dish.id
                  }
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="ff-panel ff-panel--strong rounded-[2rem] p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">
                Filter system
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Fine-tune every result instantly
              </h2>
            </div>

            <button type="button" onClick={handleReset} className="ff-button-secondary">
              <FaRedo />
              Reset everything
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`ff-chip ${!selectedCategory ? 'ff-chip--active' : ''}`}
            >
              All categories
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(String(category.id))}
                className={`ff-chip ${String(selectedCategory) === String(category.id) ? 'ff-chip--active' : ''}`}
              >
                {category.name}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {quickFilterChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, ...chip.updates }))}
                className="rounded-full border border-emerald-200/70 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-100"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Minimum price</span>
              <input
                type="number"
                placeholder="0"
                value={filters.minPrice}
                onChange={(event) => handleFilterChange('minPrice', event.target.value)}
                className="ff-input"
              />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">Maximum price</span>
              <input
                type="number"
                placeholder="120"
                value={filters.maxPrice}
                onChange={(event) => handleFilterChange('maxPrice', event.target.value)}
                className="ff-input"
              />
            </label>
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FaFireAlt className="text-orange-500" />
                Minimum calories
              </span>
              <input
                type="number"
                placeholder="0"
                value={filters.minCalories}
                onChange={(event) => handleFilterChange('minCalories', event.target.value)}
                className="ff-input"
              />
            </label>
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FaFireAlt className="text-orange-500" />
                Maximum calories
              </span>
              <input
                type="number"
                placeholder="700"
                value={filters.maxCalories}
                onChange={(event) => handleFilterChange('maxCalories', event.target.value)}
                className="ff-input"
              />
            </label>
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FaWeightHanging className="text-sky-500" />
                Minimum protein
              </span>
              <input
                type="number"
                placeholder="0"
                value={filters.minProteins}
                onChange={(event) => handleFilterChange('minProteins', event.target.value)}
                className="ff-input"
              />
            </label>
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FaWeightHanging className="text-sky-500" />
                Maximum protein
              </span>
              <input
                type="number"
                placeholder="70"
                value={filters.maxProteins}
                onChange={(event) => handleFilterChange('maxProteins', event.target.value)}
                className="ff-input"
              />
            </label>
            <label>
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FaStar className="text-amber-500" />
                Sort by
              </span>
              <select
                value={filters.sort}
                onChange={(event) => handleFilterChange('sort', event.target.value)}
                className="ff-input"
              >
                <option value="popular">Popular</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="calories">Calories: highest first</option>
                <option value="protein">Protein: highest first</option>
              </select>
            </label>
            <label className="flex items-end">
              <button
                type="button"
                onClick={() => handleFilterChange('favoritesOnly', !filters.favoritesOnly)}
                className={`ff-chip w-full justify-center ${filters.favoritesOnly ? 'ff-chip--active' : ''}`}
              >
                <FaHeart />
                Favorites only
              </button>
            </label>
          </div>
        </section>

        {visibleDishes.length === 0 ? (
          <EmptyState
            icon={FaSlidersH}
            title="No meals match these filters"
            description="Adjust the price, calories, protein, or favorites filters to reveal more meals instantly."
          />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {visibleDishes.map((dish) => (
                <motion.div key={dish.id} layout>
                  <DishCard
                    dish={dish}
                    onToggleFavorite={handleToggleFavorite}
                    favoritePending={
                      toggleFavoriteMutation.isPending &&
                      toggleFavoriteMutation.variables?.dishId === dish.id
                    }
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default Menu;
