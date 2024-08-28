// src/hooks/useErrorHandler.js
import { useState, useCallback } from 'react';

const useErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = useCallback((error) => {
    console.error('An error occurred:', error);
    setError(error.message || 'An unexpected error occurred');
    // You could also send the error to a logging service here
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

export default useErrorHandler;