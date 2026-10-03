// src/pages/CategoriesPage.jsx
import React, { useState } from 'react';
import { useCategories } from '../context/CategoryContext';
import CategoryCard from '../components/Categories/CategoryCard';
import SearchBar from '../components/Common/SearchBar';
import { FiGrid, FiList, FiPackage, FiRefreshCw } from 'react-icons/fi';

const CategoriesPage = () => {
  const { enhancedCategories, loading, error, refreshCategories } = useCategories();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculer le nombre total de produits réels
  const totalActualProducts = enhancedCategories.reduce((total, category) => {
    const productCount = category.productCount !== 50 ? category.productCount : 0;
    return total + productCount;
  }, 0);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement des catégories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="alert alert-danger">
            <h4>Erreur</h4>
            <p>{error}</p>
            <button className="btn btn-primary mt-2" onClick={refreshCategories}>
              <FiRefreshCw className="me-2" />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredCategories = enhancedCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        {/* Header */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="text-center">
              <h1 className="display-4 fw-bold text-dark mb-3">
                Nos Catégories
              </h1>
              <p className="lead text-muted mb-4">
                Découvrez tous nos produits organisés par catégories
              </p>
              
              {/* Search Bar */}
              <div className="row justify-content-center mb-4">
                <div className="col-lg-6 col-md-8">
                  <SearchBar
                    onSearch={setSearchTerm}
                    placeholder="Rechercher une catégorie..."
                    size="large"
                  />
                </div>
              </div>

              {/* Stats Réelles */}
              <div className="row justify-content-center">
                <div className="col-auto">
                  <div className="d-flex align-items-center gap-4 text-muted">
                    <div className="d-flex align-items-center">
                      <FiPackage className="text-primary me-2" />
                      <span>{enhancedCategories.length} catégories</span>
                    </div>
                    <div className="vr"></div>
                    <div className="d-flex align-items-center">
                      <span className="fw-bold text-primary">{totalActualProducts}</span>
                      <span className="ms-1">produits au total</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="text-dark mb-0">
                  {searchTerm ? `Résultats pour "${searchTerm}"` : 'Toutes les catégories'}
                </h5>
                <small className="text-muted">
                  {filteredCategories.length} catégorie(s) trouvée(s)
                </small>
              </div>
              
              {/* View Toggle */}
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-outline-primary ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <FiGrid size={16} />
                </button>
                <button
                  type="button"
                  className={`btn btn-outline-primary ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <FiList size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {viewMode === 'grid' ? (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
            {filteredCategories.map((category) => (
              <div key={category._id} className="col">
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        ) : (
          <div className="row g-4">
            {filteredCategories.map((category) => {
              const displayCount = category.productCount !== 50 ? category.productCount : 0;
              
              return (
                <div key={category._id} className="col-12">
                  <div className="card category-list-card border-0 shadow-sm h-100">
                    <div className="row g-0 h-100">
                      <div className="col-md-3">
                        <img 
                          src={category.image} 
                          className="card-img h-100 rounded-start"
                          alt={category.name}
                          style={{ objectFit: 'cover', minHeight: '150px' }}
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/400x400?text=Image';
                          }}
                        />
                      </div>
                      <div className="col-md-9">
                        <div className="card-body d-flex flex-column h-100 p-4">
                          <h5 className="card-title fw-bold text-dark">
                            {category.name}
                          </h5>
                          <p className="card-text text-muted flex-grow-1">
                            {category.description || 'Aucune description disponible.'}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className={`badge ${displayCount > 0 ? 'bg-primary' : 'bg-secondary'}`}>
                              {displayCount} produit{displayCount !== 1 ? 's' : ''}
                            </span>
                            <button className="btn btn-primary">
                              Explorer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-5">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body py-5">
                <FiPackage size={60} className="text-muted opacity-50 mb-4" />
                <h3 className="text-muted mb-3">Aucune catégorie trouvée</h3>
                <p className="text-muted mb-4">
                  {searchTerm 
                    ? `Aucun résultat pour "${searchTerm}"`
                    : "Aucune catégorie n'est disponible pour le moment."
                  }
                </p>
                {searchTerm && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => setSearchTerm('')}
                  >
                    Afficher toutes les catégories
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
