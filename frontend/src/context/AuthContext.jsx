import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import API from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
    case 'FORGOT_PASSWORD_START':
    case 'RESET_PASSWORD_START':
      return { ...state, loading: true, error: null, success: null };
      
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null,
        success: null
      };
      
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
    case 'FORGOT_PASSWORD_FAILURE':
    case 'RESET_PASSWORD_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload,
        success: null
      };

    case 'FORGOT_PASSWORD_SUCCESS':
    case 'RESET_PASSWORD_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        success: action.payload
      };
      
    case 'LOGOUT':
      return { 
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
        success: null
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };

    case 'CLEAR_SUCCESS':
      return {
        ...state,
        success: null
      };
      
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    success: null
  });

  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user && user !== 'undefined') {
        try {
          const parsedUser = JSON.parse(user);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { token, user: parsedUser }
          });
        } catch (err) {
          console.error('Invalid user in localStorage:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setInitialLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data } = await API.post('/auth/login', { email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token: data.token, user: data } });
      return { success: true, user: data };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const { data } = await API.post('/auth/register', userData);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));

      dispatch({ type: 'REGISTER_SUCCESS', payload: { token: data.token, user: data } });
      return { success: true, user: data };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      dispatch({ type: 'REGISTER_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const forgotPassword = async (email) => {
    dispatch({ type: 'FORGOT_PASSWORD_START' });
    try {
      const { data } = await API.post('/auth/forgot-password', { email });

      if (data.success) {
        dispatch({ type: 'FORGOT_PASSWORD_SUCCESS', payload: data.message });
        return { success: true, message: data.message,resetUrl: data.resetUrl  };
      } else {
        throw new Error(data.message || 'Failed to send reset email');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to send reset email';
      dispatch({ type: 'FORGOT_PASSWORD_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const resetPassword = async (resetToken, password) => {
    dispatch({ type: 'RESET_PASSWORD_START' });
    try {
      const { data } = await API.put(`/auth/reset-password/${resetToken}`, { password });

      if (data.success) {
        dispatch({ type: 'RESET_PASSWORD_SUCCESS', payload: data.message });
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to reset password';
      dispatch({ type: 'RESET_PASSWORD_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const clearSuccess = () => {
    dispatch({ type: 'CLEAR_SUCCESS' });
  };

  const value = {
    ...state,
    initialLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
    clearSuccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
