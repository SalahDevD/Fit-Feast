import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { authAPI, extractApiErrorMessage } from '../api/axios';
import { emitAndInvalidate } from '../lib/queryClient';
import { liveSyncEvents } from '../lib/liveSync';
import { queryKeys } from '../lib/queryKeys';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const getStoredAccessToken = () => localStorage.getItem('access_token');

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState(getStoredAccessToken);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    queryClient.setQueryData(queryKeys.auth.profile, null);
    queryClient.removeQueries({ queryKey: queryKeys.cart.all });
  }, [queryClient]);

  const profileQuery = useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: async () => {
      const response = await authAPI.getProfile({ suppressToast: true });
      return response.data;
    },
    enabled: Boolean(accessToken),
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (accessToken && profileQuery.isError) {
      clearSession();
    }
  }, [accessToken, clearSession, profileQuery.isError]);

  useEffect(() => {
    const handleStorage = () => {
      setAccessToken(getStoredAccessToken());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const user = profileQuery.data || null;
  const loading = Boolean(accessToken) && profileQuery.isPending;
  const isAuthenticated = Boolean(accessToken && user);

  const loadUser = useCallback(async () => {
    if (!getStoredAccessToken()) {
      clearSession();
      return false;
    }

    try {
      const data = await queryClient.fetchQuery({
        queryKey: queryKeys.auth.profile,
        queryFn: async () => {
          const response = await authAPI.getProfile({ suppressToast: true });
          return response.data;
        },
      });
      return Boolean(data);
    } catch (_error) {
      clearSession();
      return false;
    }
  }, [clearSession, queryClient]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setAccessToken(response.data.access);

      const loaded = await loadUser();
      if (loaded) {
        toast.success('Signed in successfully.');
        await emitAndInvalidate(queryClient, liveSyncEvents.AUTH_CHANGED);
      }
      return loaded;
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Incorrect credentials.';
      toast.error(errorMsg);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      toast.success('Account created. You can sign in now.');
      return true;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Registration failed.';
      toast.error(errorMsg);
      return false;
    }
  };

  const logout = () => {
    clearSession();
    toast.success('Signed out.');
    emitAndInvalidate(queryClient, liveSyncEvents.AUTH_CHANGED);
  };

  const forgotPassword = async (email) => {
    try {
      const response = await authAPI.forgotPassword({ email });
      toast.success('If that email exists, a password reset email has been sent.');
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error.response?.data || error);
      toast.error(error.response?.data?.error || 'We could not send the password reset email.');
      return null;
    }
  };

  const resetPassword = async (uid, token, newPassword, confirmPassword) => {
    try {
      await authAPI.resetPassword({
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password reset successfully.');
      return true;
    } catch (error) {
      console.error('Reset password error:', error.response?.data || error);
      const errorData = error.response?.data;
      const firstFieldError =
        errorData && typeof errorData === 'object'
          ? Object.values(errorData).flat?.()[0] || Object.values(errorData)[0]
          : null;
      toast.error(firstFieldError || errorData?.detail || 'The reset link is invalid or expired.');
      return false;
    }
  };

  const validateResetToken = async (uid, token) => {
    try {
      await authAPI.validateResetToken(uid, token);
      return { valid: true };
    } catch (error) {
      console.error('Reset token validation error:', error.response?.data || error);
      const errorData = error.response?.data;
      const firstFieldError =
        errorData && typeof errorData === 'object'
          ? Object.values(errorData).flat?.()[0] || Object.values(errorData)[0]
          : null;
      return {
        valid: false,
        message: firstFieldError || errorData?.detail || 'The reset link is invalid or expired.',
      };
    }
  };

  const startSocialLogin = async (provider, next = '/') => {
    try {
      const response = await authAPI.getSocialLoginUrl(provider, next);
      const authorizationUrl = response.data?.authorization_url;

      if (!authorizationUrl) {
      toast.error('The social login URL could not be created.');
        return false;
      }

      window.location.assign(authorizationUrl);
      return true;
    } catch (error) {
      console.error('Social login start error:', error.response?.data || error);
      return false;
    }
  };

  const completeOAuthLogin = async (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setAccessToken(accessToken);

    const loaded = await loadUser();
    if (!loaded) {
      toast.error('Social sign-in could not be completed.');
    } else {
      await emitAndInvalidate(queryClient, liveSyncEvents.AUTH_CHANGED);
    }
    return loaded;
  };

  const updateProfile = async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      queryClient.setQueryData(queryKeys.auth.profile, response.data);
      await emitAndInvalidate(queryClient, liveSyncEvents.PROFILE_CHANGED);
      toast.success('Profile updated.');
      return true;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      const errorMsg =
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Profile update failed.';
      toast.error(errorMsg);
      return false;
    }
  };

  const removeProfilePicture = async () => {
    try {
      const response = await authAPI.removeProfilePicture();
      queryClient.setQueryData(queryKeys.auth.profile, response.data);
      await emitAndInvalidate(queryClient, liveSyncEvents.PROFILE_CHANGED);
      toast.success('Profile picture removed.');
      return true;
    } catch (error) {
      console.error('Profile picture removal error:', error.response?.data || error);
      toast.error('The profile picture could not be removed.');
      return false;
    }
  };

  const changePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      await authAPI.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }, { suppressToast: true });
      toast.success('Password changed.');
      return true;
    } catch (error) {
      const errorMsg = extractApiErrorMessage(error.response?.data);
      toast.error(errorMsg || 'The password could not be changed.');
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        validateResetToken,
        startSocialLogin,
        completeOAuthLogin,
        updateProfile,
        removeProfilePicture,
        changePassword,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
