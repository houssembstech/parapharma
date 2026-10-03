import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiX, FiLoader } from 'react-icons/fi';

const SearchBar = ({ 
  onSearch, 
  placeholder = "Rechercher des produits...", 
  className = "", 
  size = "medium",
  showButton = true,
  value = "",
  products = []
}) => {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sync with parent component value
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Client-side search function
  const performClientSideSearch = (searchQuery) => {
    if (!searchQuery.trim() || products.length === 0) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter(product => 
      product.name?.toLowerCase().includes(query) 
      //product.description?.toLowerCase().includes(query) 
      //product.brand?.toLowerCase().includes(query) ||
      //product.category?.toLowerCase().includes(query)
    ).slice(0, 5);
  };

  // Search function
  const performSearch = async (searchQuery) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Try the API endpoint first
      const response = await axios.get(
        `/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      
      if (response.data.success) {
        setResults(response.data.products || []);
        setShowResults(true);
      } else {
        throw new Error(response.data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search API error:', error);
      
      // Fallback: client-side search using products prop
      try {
        const fallbackResults = performClientSideSearch(searchQuery);
        setResults(fallbackResults);
        setShowResults(true);
        // No error message for successful fallback
      } catch (fallbackError) {
        console.error('Client-side search error:', fallbackError);
        setError('Erreur de recherche. Vérifiez votre connexion.');
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Call parent's onSearch callback if provided
    if (onSearch) {
      onSearch(value);
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for API search
    if (value.trim().length >= 2) {
      timeoutRef.current = setTimeout(() => {
        performSearch(value);
      }, 500);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
        setShowResults(false);
      } else {
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setShowResults(false);
        setQuery('');
      }
    }
  };

  // Handle product click
  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
    setShowResults(false);
    setQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setError(null);
    if (onSearch) {
      onSearch('');
    }
  };

  // Get input class based on size
  const getInputClass = () => {
    const baseClass = "form-control border-end-0";
    const sizeClass = size === "small" ? "form-control-sm" : size === "large" ? "form-control-lg" : "";
    return `${baseClass} ${sizeClass} ${className}`.trim();
  };

  // Get button class based on size
  const getButtonClass = () => {
    const baseClass = "btn btn-primary";
    const sizeClass = size === "small" ? "btn-sm" : size === "large" ? "btn-lg" : "";
    return `${baseClass} ${sizeClass}`.trim();
  };

  return (
    <div className="search-bar position-relative" ref={searchRef}>
      <form onSubmit={handleSubmit} className="d-flex">
        <div className="input-group">
          <input
            type="text"
            className={getInputClass()}
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setShowResults(true)}
            aria-label="Rechercher des produits"
          />
          
          {query && (
            <button 
              type="button"
              className="btn btn-outline-secondary border-start-0"
              onClick={handleClear}
              aria-label="Effacer la recherche"
            >
              <FiX />
            </button>
          )}
          
          {showButton && (
            <button className={getButtonClass()} type="submit" aria-label="Rechercher">
              {loading ? <FiLoader className="spinner" /> : <FiSearch />}
            </button>
          )}
        </div>
      </form>

      
    </div>
  );
};

export default SearchBar;
