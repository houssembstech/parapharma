import React, { useState, useContext, useEffect } from 'react';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/Products/ProductCard';

const Products = () => {
  const { products, loading, error, refreshProducts } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(12);
  const [priceRange, setPriceRange] = useState([0, 9999]);

  // Extract unique categories
  const categories = ['all', ...new Set(products.map(product => 
    typeof product.category === 'object' ? product.category.name : product.category
  ).filter(Boolean))];

  useEffect(() => {
    filterAndSortProducts();
  }, [products, selectedCategory, searchTerm, sortBy, priceRange]);

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        const productCategory = typeof product.category === 'object' 
          ? product.category.name 
          : product.category;
        return productCategory === selectedCategory;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleAddToCart = (product) => {
    if (!user) {
      alert('Veuillez vous connecter pour ajouter des articles au panier');
      return;
    }
    addToCart(product);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handlePriceRangeChange = (min, max) => {
    setPriceRange([min, max]);
  };

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="text-danger display-1 mb-4">⚠️</div>
          <h2 className="h3 text-dark mb-3">Erreur de chargement des produits</h2>
          <p className="text-muted mb-4">{error}</p>
          <button
            onClick={refreshProducts}
            className="btn btn-primary btn-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      {/* Header Section */}
      <div className="bg-white border-bottom">
        <div className="container py-5">
          <div className="text-center">
            <h1 className="display-5 fw-bold text-dark mb-3">Nos Produits</h1>
            <p className="lead text-muted max-w-2xl mx-auto">
              Découvrez notre large gamme de produits pharmaceutiques et solutions de santé
            </p>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <div className="row">
          {/* Sidebar Filters */}
          <div className="col-lg-3 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                {/* Search */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Recherche</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>

                {/* Categories */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Catégories</label>
                  <div className="nav flex-column">
                    {categories.map(category => (
                      <button
                        key={category}
                        className={`nav-link text-start border-0 rounded mb-1 ${
                          selectedCategory === category 
                            ? 'bg-primary text-white' 
                            : 'text-dark hover-bg-light'
                        }`}
                        onClick={() => handleCategoryChange(category)}
                      >
                        {category === 'all' ? 'Toutes les catégories' : category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Fourchette de prix: {priceRange[0]} DT - {priceRange[1]} DT
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="0"
                    max="9999"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  />
                </div>

                {/* Sort Options */}
                <div>
                  <label className="form-label fw-semibold">Trier par</label>
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    className="form-select"
                  >
                    <option value="name">Nom (A-Z)</option>
                    <option value="price-low">Prix (Croissant)</option>
                    <option value="price-high">Prix (Décroissant)</option>
                    <option value="newest">Nouveautés</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="col-lg-9">
            {/* Results Info */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <p className="text-muted mb-0">
                Affichage de {currentProducts.length} sur {filteredProducts.length} produits
                {selectedCategory !== 'all' && ` dans ${selectedCategory}`}
              </p>
              <div className="text-muted small">
                Page {currentPage} sur {totalPages}
              </div>
            </div>

            {/* Products Grid */}
            {currentProducts.length > 0 ? (
              <>
                <div className="row g-3">
                  {currentProducts.map((product) => (
                    <div key={product._id} className="col-sm-6 col-md-4 col-xl-3">
                      <ProductCard 
                        product={product}
                        onAddToCart={() => handleAddToCart(product)}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="d-flex justify-content-center mt-5">
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Précédent
                        </button>
                      </li>
                      
                      {[...Array(totalPages)].map((_, index) => (
                        <li key={index + 1} className="page-item">
                          <button
                            className={`page-link ${currentPage === index + 1 ? 'active' : ''}`}
                            onClick={() => paginate(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Suivant
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-5">
                <div className="text-muted display-1 mb-3">🔍</div>
                <h3 className="h4 text-dark mb-2">Aucun produit trouvé</h3>
                <p className="text-muted mb-4">
                  Essayez d'ajuster vos critères de recherche ou de filtrage
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                    setPriceRange([0, 1000]);
                  }}
                  className="btn btn-primary"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
