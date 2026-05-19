const EMPTY_VALUE = '';

export const parseOptionalNumber = (value) => {
  if (value === EMPTY_VALUE || value === null || value === undefined) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const resolveDishNumber = (dish, keys) => {
  for (const key of keys) {
    const parsedValue = parseOptionalNumber(dish?.[key]);
    if (parsedValue !== null) {
      return parsedValue;
    }
  }

  return null;
};

export const resolveDishPrice = (dish) => resolveDishNumber(dish, ['price', 'base_price']);
export const resolveDishCalories = (dish) => resolveDishNumber(dish, ['calories', 'calories_kcal']);
export const resolveDishProtein = (dish) => resolveDishNumber(dish, ['proteins', 'protein_g']);
export const resolveDishCreatedAt = (dish) => {
  const createdAtTimestamp = Date.parse(dish?.created_at || '');
  if (Number.isFinite(createdAtTimestamp)) {
    return createdAtTimestamp;
  }

  const fallbackId = parseOptionalNumber(dish?.id);
  return fallbackId ?? 0;
};

const matchesMinimum = (value, minimum) => minimum === null || (value !== null && value >= minimum);
const matchesMaximum = (value, maximum) => maximum === null || (value !== null && value <= maximum);

export const filterMenuDishes = (dishes = [], filters = {}) => {
  const minPrice = parseOptionalNumber(filters.minPrice);
  const maxPrice = parseOptionalNumber(filters.maxPrice);
  const minCalories = parseOptionalNumber(filters.minCalories);
  const maxCalories = parseOptionalNumber(filters.maxCalories);
  const minProteins = parseOptionalNumber(filters.minProteins);
  const maxProteins = parseOptionalNumber(filters.maxProteins);

  return dishes.filter((dish) => {
    const price = resolveDishPrice(dish);
    const calories = resolveDishCalories(dish);
    const proteins = resolveDishProtein(dish);

    return (
      matchesMinimum(price, minPrice) &&
      matchesMaximum(price, maxPrice) &&
      matchesMinimum(calories, minCalories) &&
      matchesMaximum(calories, maxCalories) &&
      matchesMinimum(proteins, minProteins) &&
      matchesMaximum(proteins, maxProteins)
    );
  });
};

const sortWithFallback = (leftValue, rightValue, fallbackLeft, fallbackRight, direction = 'asc') => {
  if (leftValue === rightValue) {
    return fallbackLeft - fallbackRight;
  }

  if (leftValue === null) {
    return 1;
  }

  if (rightValue === null) {
    return -1;
  }

  return direction === 'desc' ? rightValue - leftValue : leftValue - rightValue;
};

export const sortMenuDishes = (dishes = [], sort = 'popular') => {
  const nextDishes = [...dishes];

  nextDishes.sort((leftDish, rightDish) => {
    const leftId = parseOptionalNumber(leftDish?.id) ?? 0;
    const rightId = parseOptionalNumber(rightDish?.id) ?? 0;

    switch (sort) {
      case 'price_asc':
        return sortWithFallback(
          resolveDishPrice(leftDish),
          resolveDishPrice(rightDish),
          leftId,
          rightId,
          'asc'
        );
      case 'price_desc':
        return sortWithFallback(
          resolveDishPrice(leftDish),
          resolveDishPrice(rightDish),
          leftId,
          rightId,
          'desc'
        );
      case 'calories':
        return sortWithFallback(
          resolveDishCalories(leftDish),
          resolveDishCalories(rightDish),
          leftId,
          rightId,
          'desc'
        );
      case 'protein':
        return sortWithFallback(
          resolveDishProtein(leftDish),
          resolveDishProtein(rightDish),
          leftId,
          rightId,
          'desc'
        );
      case 'newest':
        return sortWithFallback(
          resolveDishCreatedAt(leftDish),
          resolveDishCreatedAt(rightDish),
          leftId,
          rightId,
          'desc'
        );
      case 'featured':
      case 'popular':
      default:
        return sortWithFallback(
          parseOptionalNumber(leftDish?.favorites_count) ?? 0,
          parseOptionalNumber(rightDish?.favorites_count) ?? 0,
          leftId,
          rightId,
          'desc'
        );
    }
  });

  return nextDishes;
};
