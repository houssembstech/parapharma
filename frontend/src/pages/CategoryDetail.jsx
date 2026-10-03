import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCategories } from '../context/CategoryContext';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/Products/ProductCard';
import { FiArrowLeft, FiPackage, FiGrid, FiList } from 'react-icons/fi';

const CategoryDetail = () => {
  const { slug } = useParams();
  const { enhancedCategories } = useCategories();
  const { products } = useProducts();
  const [viewMode, setViewMode] = useState('grid');

  const category = enhancedCategories.find(cat => cat.slug === slug);
  const categoryProducts = products.filter(product => 
    product.category && (
      product.category._id === category?._id || 
      product.category.slug === slug ||
      (typeof product.category === 'string' && product.category === category?._id)
    )
  );

  if (!category) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h2>Catégorie non trouvée</h2>
          <p className="text-muted mb-4">La catégorie que vous recherchez n'existe pas.</p>
          <Link to="/categories" className="btn btn-primary">
            <FiArrowLeft className="me-2" />
            Retour aux catégories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link to="/" className="text-decoration-none">Accueil</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/categories" className="text-decoration-none">Catégories</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {category.name}
            </li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="row mb-5">
          <div className="col-12">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="row g-0">
                <div className="col-md-4">
                  <img 
                    src={category.image} 
                    className="card-img h-100"
                    alt={category.name}
                    style={{ objectFit: 'cover', height: '250px' }}
                    onError={(e) => {
                      e.target.src = 'https://placehold.co/400x400?text=Image';
                    }}
                  />
                </div>
                <div className="col-md-8">
                  <div className="card-body p-4 d-flex flex-column h-100">
                    <h1 className="display-5 fw-bold text-dark mb-3">
                      {category.name}
                    </h1>
                    <p className="lead text-muted flex-grow-1">
                      {category.description}
                    </p>
                    <div className="d-flex align-items-center gap-4">
                      <div className="d-flex align-items-center gap-2">
                        <FiPackage className="text-primary" size={20} />
                        <span className="fw-bold text-dark">
                          {categoryProducts.length} produits
                        </span>
                      </div>
                      {category.featured && (
                        <span className="badge bg-warning text-dark">
                          Catégorie vedette
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="text-dark mb-0">
                Produits dans cette catégorie
              </h3>
              
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

            {/* Products Grid */}
            {categoryProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                  {categoryProducts.map((product) => (
                    <div key={product._id} className="col">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="row g-4">
                  {categoryProducts.map((product) => (
                    <div key={product._id} className="col-12">
                      {/* List view implementation */}
                      <div className="card product-list-card border-0 shadow-sm h-100">
                        <div className="row g-0 h-100">
                          <div className="col-md-3">
                            <img 
                              src={product.mainImage || product.images?.[0]} 
                              className="card-img h-100 rounded-start"
                              alt={product.name}
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/400x400?text=Image';
                              }}
                            />
                          </div>
                          <div className="col-md-9">
                            <div className="card-body d-flex flex-column h-100 p-4">
                              <h5 className="card-title fw-bold text-dark">
                                {product.name}
                              </h5>
                              <p className="card-text text-muted flex-grow-1">
                                {product.description}
                              </p>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="h4 fw-bold text-dark">
                                  {product.price} DT
                                </span>
                                <Link 
                                  to={`/products/${product.slug || product._id}`}
                                  className="btn btn-primary"
                                >
                                  Voir détails
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-5">
                <div className="card shadow-lg border-0 rounded-4">
                  <div className="card-body py-5">
                    <FiPackage size={60} className="text-muted opacity-50 mb-4" />
                    <h3 className="text-muted mb-3">Aucun produit trouvé</h3>
                    <p className="text-muted mb-4">
                      Aucun produit n'est disponible dans cette catégorie pour le moment.
                    </p>
                    <Link to="/categories" className="btn btn-primary">
                      <FiArrowLeft className="me-2" />
                      Explorer d'autres catégories
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetail;
