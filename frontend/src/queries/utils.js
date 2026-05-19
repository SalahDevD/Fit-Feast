export const extractCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload?.results || payload?.data || [];
};

export const extractTotalCount = (payload) => {
  if (Array.isArray(payload)) {
    return payload.length;
  }

  return Number(payload?.count || 0);
};

export const createStableObject = (value) => JSON.parse(JSON.stringify(value || {}));

