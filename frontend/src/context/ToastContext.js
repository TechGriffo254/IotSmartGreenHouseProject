import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ToastContainer } from '../components/common/Toast';

const ToastContext = createContext();

const toastReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.payload];
    case 'REMOVE_TOAST':
      return state.filter(toast => toast.id !== action.payload);
    case 'CLEAR_ALL':
      return [];
    default:
      return state;
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback((message, type = 'info', options = {}) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = {
      id,
      message,
      type,
      autoClose: options.autoClose !== false,
      ...options
    };
    
    dispatch({ type: 'ADD_TOAST', payload: toast });
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const clearAllToasts = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // Convenience methods
  const success = useCallback((message, options) => addToast(message, 'success', options), [addToast]);
  const error = useCallback((message, options) => addToast(message, 'error', options), [addToast]);
  const warning = useCallback((message, options) => addToast(message, 'warning', options), [addToast]);
  const info = useCallback((message, options) => addToast(message, 'info', options), [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
