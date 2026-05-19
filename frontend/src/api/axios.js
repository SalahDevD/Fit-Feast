import axios from 'axios';
import toast from 'react-hot-toast';

const RAW_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const APP_BASE_URL = RAW_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
const API_BASE_URL = `${APP_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshTokenRequest = null;

export const extractApiErrorMessage = (errorData) => {
  if (!errorData) {
    return 'Something went wrong.';
  }

  if (errorData instanceof Error && typeof errorData.message === 'string') {
    return errorData.message;
  }

  if (typeof errorData === 'string') {
    return errorData;
  }

  if (Array.isArray(errorData)) {
    const firstItem = errorData[0];
    return extractApiErrorMessage(firstItem);
  }

  if (typeof errorData === 'object') {
    if (typeof errorData.message === 'string') {
      return errorData.message;
    }
    if (typeof errorData.error === 'string') {
      return errorData.error;
    }
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    }

    for (const value of Object.values(errorData)) {
      if (typeof value === 'string') {
        return value;
      }
      if (value && (Array.isArray(value) || typeof value === 'object')) {
        const nestedMessage = extractApiErrorMessage(value);
        if (nestedMessage && nestedMessage !== 'Something went wrong.') {
          return nestedMessage;
        }
      }
    }
  }

  return 'Something went wrong.';
};

// 🔑 Interceptor: attach token & handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData - let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// ⚠️ Interceptor: handle errors + refresh
const getAuthRedirectPath = () => {
  const publicAuthPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  return publicAuthPaths.includes(window.location.pathname) ? null : '/login';
};

const refreshAccessToken = async () => {
  if (!refreshTokenRequest) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available.');
    }

    refreshTokenRequest = axios
      .post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken })
      .then((response) => {
        const nextAccessToken = response.data?.access;
        if (!nextAccessToken) {
          throw new Error('No access token returned during refresh.');
        }

        localStorage.setItem('access_token', nextAccessToken);
        return nextAccessToken;
      })
      .finally(() => {
        refreshTokenRequest = null;
      });
  }

  return refreshTokenRequest;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const message = extractApiErrorMessage(error.response?.data || error.message || error);
    
    // Log détaillé pour les erreurs 400/500
    if (error.response?.status === 400 || error.response?.status === 500) {
      console.error('❌ API ERROR:', {
        status: error.response.status,
        url: error.config.url,
        data: error.config.data,
        errors: error.response.data,
        message,
      });
    }
    
    // Don't retry on auth endpoints (login, register, token refresh)
    const authEndpoints = ['/token/', '/register/', '/change-password/', '/auth/forgot-password/', '/auth/reset-password/', '/auth/oauth/'];
    const requestUrl = originalRequest?.url || '';
    const isAuthEndpoint = authEndpoints.some(endpoint => requestUrl.includes(endpoint));

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const nextAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
        return api(originalRequest);
      } catch (_refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        const redirectPath = getAuthRedirectPath();
        if (redirectPath) {
          window.location.assign(redirectPath);
          return Promise.reject(error);
        }
      }
    }
    if (!error.config?.suppressToast) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

// =======================
// API Services
// =======================

export const authAPI = {
  register: (userData) => api.post('/register/', userData),
  login: (credentials) => api.post('/token/', credentials),
  refreshToken: (refresh) => api.post('/token/refresh/', { refresh }),
  getProfile: (config = {}) => api.get('/users/profile/', config),
  updateProfile: (data) => api.put('/users/profile/', data),
  removeProfilePicture: () => api.delete('/users/profile/'),
  changePassword: (data, config = {}) => api.post('/users/change-password/', data, config),
  forgotPassword: (data) => api.post('/auth/forgot-password/', data),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  validateResetToken: (uid, token) =>
    api.get('/auth/reset-password/', {
      params: { uid, token },
      suppressToast: true,
    }),
  getSocialLoginUrl: (provider, next = '/') =>
    api.get(`/auth/oauth/${provider}/start/`, {
      params: { next },
    }),
};

export const dishesAPI = {
  getAll: (params) => api.get('/dishes/', { params }),
  getById: (id) => api.get(`/dishes/${id}/`),
  search: (query) => api.get('/dishes/search/', { params: { q: query } }),
  getByCategory: (categoryId) => api.get('/dishes/', { params: { category: categoryId } }),
  getRecommended: () => api.get('/dishes/recommended/'),
  getCategories: () => api.get('/categories/'),
  getFavorites: () => api.get('/dishes/favorites/'),
  toggleFavorite: (dishId) => api.post(`/dishes/${dishId}/favorite/`),
};

export const customDishAPI = {
  getAll: () => api.get('/custom-dishes/'),
  create: (data) => api.post('/custom-dishes/', data),
  getById: (id) => api.get(`/custom-dishes/${id}/`),
  update: (id, data) => api.put(`/custom-dishes/${id}/`, data),
  addComponent: (id, componentId, quantity) =>
    api.post(`/custom-dishes/${id}/add-component/`, {
      component_id: componentId,
      quantity_grams: quantity,
    }),
  removeComponent: (id, componentId) =>
    api.delete(`/custom-dishes/${id}/remove-component/`, {
      data: { component_id: componentId },
    }),
  getAvailableComponents: () => api.get('/custom-dishes/available-components/'),
};

export const cartAPI = {
  getCart: () => api.get('/cart/my-cart/'),
  addItem: (data) => api.post('/cart/add/', data),
  updateItem: (itemId, quantity) =>
    api.post('/cart/update-item/', { item_id: itemId, quantity }),
  removeItem: (itemId) => api.post('/cart/remove-item/', { item_id: itemId }),
  clearCart: () => api.post('/cart/clear/'),
  getCount: () => api.get('/cart/count/'),
};

export const ordersAPI = {
  getAll: () => api.get('/orders/'),
  getMyOrders: () => api.get('/orders/my-orders/'),
  create: (data) => api.post('/orders/', data),
  getById: (id) => api.get(`/orders/${id}/`),
  getTimeline: (id) => api.get(`/orders/${id}/timeline/`),
  getCheckoutReductions: (deliveryType = 'DELIVERY') =>
    api.get('/orders/checkout-reductions/', { params: { delivery_type: deliveryType } }),
  getOrderCheckoutReductions: (id) => api.get(`/orders/${id}/checkout-reductions/`),
  applyReduction: (id, data) => api.post(`/orders/${id}/apply-reduction/`, data),
};

export const loyaltyAPI = {
  getAccount: () => api.get('/loyalty/my-account/'),
  getTransactions: () => api.get('/loyalty/transactions/'),
  getRedemptions: () => api.get('/loyalty/redemptions/'),
  getRewards: () => api.get('/rewards/'),
  redeemReward: (rewardId) => api.post('/loyalty/redeem/', { reward_id: rewardId }),
};

export const mealPrepAPI = {
  getCurrentWeek: () => api.get('/meal-plans/current-week/'),
  getNextWeek: () => api.get('/meal-plans/next-week/'),
  getByWeek: (weekStart) => api.get(`/meal-plans/week/${weekStart}/`),
  create: (data) => api.post('/meal-plans/', data),
  addItem: (planId, data) => api.post(`/meal-plans/${planId}/add-item/`, data),
  removeItem: (planId, itemId) => api.delete(`/meal-plans/${planId}/remove-item/${itemId}/`),
};

export const chatbotAPI = {
  sendMessage: (messageOrPayload, conversationId = null) => {
    if (messageOrPayload instanceof FormData) {
      return api.post('/chatbot/message/', messageOrPayload);
    }

    const payload =
      typeof messageOrPayload === 'object' && messageOrPayload !== null
        ? messageOrPayload
        : { message: messageOrPayload, conversation_id: conversationId };

    return api.post('/chatbot/message/', payload);
  },
  getConversations: () => api.get('/chatbot/conversations/'),
  getConversation: (id) => api.get(`/chatbot/conversation/${id}/`),
};

export const socialAPI = {
  getFeed: () => api.get('/posts/feed/'),
  getMyPosts: () => api.get('/posts/my-posts/'),
  createPost: (data) => api.post('/posts/', data),
  updatePost: (postId, data) => api.patch(`/posts/${postId}/`, data),
  deletePost: (postId) => api.delete(`/posts/${postId}/`),
  likePost: (postId) => api.post(`/posts/${postId}/like/`),
  commentPost: (postId, content) => api.post(`/posts/${postId}/comment/`, { content }),
  getComments: (postId) => api.get(`/posts/${postId}/comments/`),
  getChallenges: () => api.get('/challenges/'),
  getMyChallenges: () => api.get('/challenges/my-challenges/'),
  getLeaderboard: () => api.get('/challenges/leaderboard/'),
  joinChallenge: (challengeId) => api.post(`/challenges/${challengeId}/join/`),
  updateChallengeProgress: (challengeId, progress) =>
    api.post(`/challenges/${challengeId}/update-progress/`, { progress }),
};

export const faqAPI = {
  getAll: () => api.get('/faq/'),
  getCategories: () => api.get('/faq-categories/'),
  getByCategory: (categoryId) => api.get(`/faq/by-category/${categoryId}/`),
  search: (query) => api.get('/faq/search/', { params: { q: query } }),
  giveFeedback: (faqId, wasHelpful) =>
    api.post('/faq/feedback/', { faq_id: faqId, was_helpful: wasHelpful }),
  getUserFeedback: () => api.get('/faq/user-feedback/'),
};

export const employeeAPI = {
  // ============= EMPLOYEE ORDERS =============
  getOrders: (params) => api.get('/employee/orders/', { params }),
  getOrderDetail: (id) => api.get(`/employee/orders/${id}/`),
  updateOrderStatus: (id, status) => api.put(`/employee/orders/${id}/status/`, { status }),
  updateItemStatus: (orderId, itemId, status) => 
    api.put(`/employee/orders/${orderId}/items/${itemId}/status/`, { preparation_status: status }),
};

export const adminAPI = {
  // ============= DASHBOARD STATS =============
  getStats: () => api.get('/admin/dashboard/stats/'),
  getPaymentAnalytics: (params) => api.get('/admin/payments/analytics/', { params }),
  listPayments: (params) => api.get('/admin/payments/', { params }),
  getPaymentDetails: (id) => api.get(`/admin/payments/${id}/`),

  // ============= USERS MANAGEMENT =============
  listUsers: (params) => api.get('/admin/users/', { params }),
  createUser: (data) => api.post('/admin/users/', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}/`),
  activateUsers: (user_ids) => api.post('/admin/users/activate/', { user_ids }),
  deactivateUsers: (user_ids) => api.post('/admin/users/deactivate/', { user_ids }),

  // ============= DISHES MANAGEMENT =============
  listDishes: (params) => api.get('/admin/dishes/', { params }),
  getDish: (id) => api.get(`/admin/dishes/${id}/`),
  createDish: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'image' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key === 'categories') {
        // Categories peuvent être string, number, ou array
        if (Array.isArray(data[key])) {
          data[key].forEach(cat => formData.append('categories', cat));
        } else if (data[key]) {
          // Single category ID
          formData.append('categories', data[key]);
        }
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    return api.post('/admin/dishes/', formData);
  },
  updateDish: (id, data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'image' && data[key] instanceof File) {
        formData.append(key, data[key]);
      } else if (key === 'categories') {
        // Categories peuvent être string, number, ou array
        if (Array.isArray(data[key])) {
          data[key].forEach(cat => formData.append('categories', cat));
        } else if (data[key]) {
          // Single category ID
          formData.append('categories', data[key]);
        }
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    return api.put(`/admin/dishes/${id}/`, formData);
  },
  deleteDish: (id) => api.delete(`/admin/dishes/${id}/`),
  bulkActivateDishes: (dish_ids) => api.post('/admin/dishes/bulk_activate/', { dish_ids }),
  bulkDeactivateDishes: (dish_ids) => api.post('/admin/dishes/bulk_deactivate/', { dish_ids }),

  // ============= CATEGORIES MANAGEMENT =============
  listCategories: (params) => api.get('/admin/categories/', { params }),
  createCategory: (data) => api.post('/admin/categories/', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}/`),

  // ============= CHALLENGES MANAGEMENT =============
  listChallenges: (params) => api.get('/admin/challenges/', { params }),
  createChallenge: (data) => api.post('/admin/challenges/', data),
  updateChallenge: (id, data) => api.put(`/admin/challenges/${id}/`, data),
  deleteChallenge: (id) => api.delete(`/admin/challenges/${id}/`),
  activateChallenge: (id) => api.post(`/admin/challenges/${id}/activate/`),
  deactivateChallenge: (id) => api.post(`/admin/challenges/${id}/deactivate/`),

  // ============= POSTS MODERATION =============
  listPosts: (params) => api.get('/admin/posts/', { params }),
  deletePost: (id) => api.delete(`/admin/posts/${id}/`),
  getPostComments: (id) => api.get(`/admin/posts/${id}/comments/`),
  deletePostComment: (postId, commentId) => api.delete(`/admin/posts/${postId}/comments/${commentId}/`),

  // ============= ORDERS MANAGEMENT =============
  listOrders: (params) => api.get('/admin/orders/', { params }),
  getOrderDetails: (id) => api.get(`/admin/orders/${id}/`),
  updateOrderStatus: (id, status) => api.post(`/admin/orders/${id}/update_status/`, { status }),
};

// ✅ Added missing APIs
export const paymentAPI = {
  createPayment: (data) => api.post('/payments/create-payment/', data),
  createPaymentIntent: (orderId) => api.post('/stripe/create-payment-intent/', { order_id: orderId }),
  confirmPayment: (paymentIntentId) =>
    api.post('/stripe/confirm-payment/', { payment_intent_id: paymentIntentId }, { suppressToast: true }),
  getPaymentStatus: ({ orderId, paymentIntentId, refresh = false } = {}) =>
    api.get('/stripe/payment-status/', {
      params: {
        ...(orderId ? { order_id: orderId } : {}),
        ...(paymentIntentId ? { payment_intent_id: paymentIntentId } : {}),
        ...(refresh ? { refresh: 1 } : {}),
      },
      suppressToast: true,
    }),
  getStripeConfig: () => api.get('/stripe/config/'),
  listTransactions: () => api.get('/payments/'),
  listInvoices: () => api.get('/invoices/'),
};

export const allergiesAPI = {
  // Get all allergens (public)
  getAllergens: () => api.get('/allergens/'),
  
  // Get all diet types (public)
  getDietTypes: () => api.get('/diet-types/'),
  
  // Get user's allergies (authenticated)
  getUserAllergies: () => api.get('/user-allergies/'),
  
  // Get user's diet types (authenticated)
  getUserDiets: () => api.get('/user-diets/'),
  
  // Add allergen to user allergies
  addAllergy: (data) => api.post('/user-allergies/', data),
  
  // Remove allergen from user allergies
  removeAllergy: (allergyId) => api.delete(`/user-allergies/${allergyId}/`),
  
  // Add diet type to user
  addDiet: (data) => api.post('/user-diets/', data),
  
  // Remove diet type from user
  removeDiet: (dietId) => api.delete(`/user-diets/${dietId}/`),
};

export const aiAPI = {
  generateDish: (descriptionOrPayload, ingredients = [], saveDish = false) => {
    const payload =
      typeof descriptionOrPayload === 'object' && descriptionOrPayload !== null
        ? descriptionOrPayload
        : {
            description: descriptionOrPayload,
            ingredients,
            save_dish: saveDish,
          };

    return api.post('/ai/generate-dish/', payload);
  },
};

export default api;
