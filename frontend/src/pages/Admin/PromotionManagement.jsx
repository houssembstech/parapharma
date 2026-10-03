import React, { useState, useEffect } from 'react';
import { promotionAPI } from '../../services/api';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiFilter, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 10,
    minimumOrderAmount: 0,
    maximumDiscount: '',
    startDate: getDefaultStartDate(),
    endDate: getDefaultEndDate(),
    usageLimit: '',
    isActive: true,
    applicableProducts: [],
    applicableCategories: []
  });

  // Fonctions utilitaires pour les dates par défaut
  function getDefaultStartDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  function getDefaultEndDate() {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth.toISOString().split('T')[0];
  }

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    filterPromotions();
  }, [promotions, searchTerm, statusFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching promotions...');
      
      // Utiliser l'API normale
      const response = await promotionAPI.getAllPromotions();
      
      console.log('📦 API Response:', response);
      
      let promotionsData = [];
      
      // Gestion de différents formats de réponse
      if (Array.isArray(response.data)) {
        promotionsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        promotionsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.promotions)) {
        promotionsData = response.data.promotions;
      } else if (Array.isArray(response)) {
        promotionsData = response;
      } else if (response.data && typeof response.data === 'object') {
        // Si c'est un seul objet, le mettre dans un tableau
        promotionsData = [response.data];
      }
      
      console.log('✅ Processed promotions:', promotionsData);
      
      if (promotionsData.length === 0) {
        console.warn('⚠️ No promotions found in response');
      }
      
      setPromotions(promotionsData);
      
    } catch (error) {
      console.error('❌ Error fetching promotions:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to fetch promotions';
      
      setError(`Erreur: ${errorMessage}`);
      
      // Données de démonstration en cas d'erreur
      setPromotions(getDemoPromotions());
    } finally {
      setLoading(false);
    }
  };

  // Données de démonstration pour le développement
  const getDemoPromotions = () => {
    return [
      {
        _id: '1',
        code: 'BIENVENUE10',
        description: '10% de réduction sur la première commande',
        discountType: 'percentage',
        discountValue: 10,
        minimumOrderAmount: 50,
        maximumDiscount: 20,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 100,
        usedCount: 45,
        isActive: true,
        applicableProducts: [],
        applicableCategories: []
      },
      {
        _id: '2',
        code: 'LIVRAISONGRATUITE',
        description: 'Livraison gratuite sur les commandes supérieures à 75€',
        discountType: 'free_shipping',
        discountValue: 0,
        minimumOrderAmount: 75,
        maximumDiscount: null,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: null,
        usedCount: 23,
        isActive: true,
        applicableProducts: [],
        applicableCategories: []
      },
      {
        _id: '3',
        code: 'ETE2024',
        description: 'Promotion été 2024 - 15% de réduction',
        discountType: 'percentage',
        discountValue: 15,
        minimumOrderAmount: 0,
        maximumDiscount: 30,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        usageLimit: 200,
        usedCount: 89,
        isActive: false,
        applicableProducts: [],
        applicableCategories: []
      }
    ];
  };

  const filterPromotions = () => {
    let filtered = promotions;

    // Appliquer le filtre de recherche
    if (searchTerm) {
      filtered = filtered.filter(promo =>
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (promo.description && promo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Appliquer le filtre de statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(promo =>
        statusFilter === 'active' ? promo.isActive : !promo.isActive
      );
    }

    setFilteredPromotions(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      // Validation
      if (!formData.code.trim()) {
        setError('Le code promotionnel est requis');
        return;
      }
      
      if (!formData.description.trim()) {
        setError('La description est requise');
        return;
      }
      
      if (formData.discountType !== 'free_shipping' && (!formData.discountValue || formData.discountValue <= 0)) {
        setError('La valeur de la réduction doit être supérieure à 0');
        return;
      }
      
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('La date de fin doit être après la date de début');
        return;
      }

      const apiData = {
        code: formData.code.toUpperCase().trim(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: formData.discountType !== 'free_shipping' ? parseFloat(formData.discountValue) : 0,
        minimumOrderAmount: parseFloat(formData.minimumOrderAmount) || 0,
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        isActive: Boolean(formData.isActive),
        applicableProducts: formData.applicableProducts,
        applicableCategories: formData.applicableCategories
      };

      console.log('📤 Sending promotion data:', apiData);

      let result;
      if (editingPromotion) {
        result = await promotionAPI.updatePromotion(editingPromotion._id, apiData);
        setSuccess('Promotion mise à jour avec succès !');
      } else {
        result = await promotionAPI.createPromotion(apiData);
        setSuccess('Promotion créée avec succès !');
      }

      console.log('✅ Server response:', result);

      setShowForm(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Error saving promotion:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erreur lors de la sauvegarde de la promotion';
      
      setError(`Erreur: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrderAmount: 0,
      maximumDiscount: '',
      startDate: getDefaultStartDate(),
      endDate: getDefaultEndDate(),
      usageLimit: '',
      isActive: true,
      applicableProducts: [],
      applicableCategories: []
    });
  };

  const handleEdit = (promotion) => {
    console.log('✏️ Editing promotion:', promotion);
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code || '',
      description: promotion.description || '',
      discountType: promotion.discountType || 'percentage',
      discountValue: promotion.discountValue || 10,
      minimumOrderAmount: promotion.minimumOrderAmount || 0,
      maximumDiscount: promotion.maximumDiscount || '',
      startDate: formatDateForInput(promotion.startDate),
      endDate: formatDateForInput(promotion.endDate),
      usageLimit: promotion.usageLimit || '',
      isActive: promotion.isActive !== undefined ? promotion.isActive : true,
      applicableProducts: promotion.applicableProducts || [],
      applicableCategories: promotion.applicableCategories || []
    });
    setShowForm(true);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return getDefaultStartDate();
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return getDefaultStartDate();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.')) {
      try {
        setError(null);
        setSuccess(null);
        await promotionAPI.deletePromotion(id);
        setSuccess('Promotion supprimée avec succès !');
        fetchPromotions();
        
        setTimeout(() => setSuccess(null), 3000);
      } catch (error) {
        console.error('❌ Error deleting promotion:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message || 
                            'Erreur lors de la suppression';
        
        setError(`Erreur: ${errorMessage}`);
      }
    }
  };

  const togglePromotionStatus = async (promotion) => {
    try {
      setError(null);
      setSuccess(null);
      
      const updatedData = {
        ...promotion,
        isActive: !promotion.isActive
      };
      
      await promotionAPI.updatePromotion(promotion._id, updatedData);
      setSuccess(`Promotion ${updatedData.isActive ? 'activée' : 'désactivée'} avec succès !`);
      fetchPromotions();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('❌ Error updating promotion status:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Erreur lors de la mise à jour du statut';
      
      setError(`Erreur: ${errorMessage}`);
    }
  };

  const getStatusBadge = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (!promotion.isActive) {
      return { text: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (now < startDate) {
      return { text: 'Programmée', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (now > endDate) {
      return { text: 'Expirée', color: 'bg-red-100 text-red-800' };
    }
    
    return { text: 'Active', color: 'bg-green-100 text-green-800' };
  };

  const getDiscountDisplay = (promotion) => {
    switch (promotion.discountType) {
      case 'percentage':
        return `${promotion.discountValue}% de réduction`;
      case 'fixed':
        return `${promotion.discountValue}€ de réduction`;
      case 'free_shipping':
        return 'Livraison gratuite';
      default:
        return 'Réduction inconnue';
    }
  };

  // Fonction pour tester l'API manuellement
  const testAPIEndpoint = async () => {
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/promotions`);
      console.log('🔍 API Test Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 API Test Data:', data);
        setSuccess('API endpoint test successful!');
      } else {
        setError(`API returned status: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('🔍 API Test Error:', error);
      setError(`API test failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des promotions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Promotions</h1>
            <p className="text-gray-600">Gérez et suivez toutes vos campagnes promotionnelles</p>
          </div>
          <div className="flex gap-2 mt-4 lg:mt-0">
            <button
              onClick={testAPIEndpoint}
              className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
              title="Tester l'endpoint API"
            >
              <FiRefreshCw size={16} />
              Tester API
            </button>
            <button
              onClick={() => {
                setEditingPromotion(null);
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiPlus size={20} />
              Nouvelle Promotion
            </button>
          </div>
        </div>

        {/* Alertes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FiAlertCircle />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">
              ×
            </button>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par code ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actives</option>
                <option value="inactive">Inactives</option>
              </select>
              <button
                onClick={fetchPromotions}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <FiRefreshCw size={16} />
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Tableau des promotions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {filteredPromotions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <FiSearch size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {promotions.length === 0 ? 'Aucune promotion trouvée' : 'Aucune promotion correspondante'}
              </h3>
              <p className="text-gray-600 mb-6">
                {promotions.length === 0 
                  ? 'Commencez par créer votre première promotion.' 
                  : 'Ajustez vos critères de recherche ou de filtrage.'
                }
              </p>
              {promotions.length === 0 && (
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FiPlus size={20} />
                  Créer une promotion
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Réduction
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Validité
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisation
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPromotions.map((promotion) => {
                    const status = getStatusBadge(promotion);
                    return (
                      <tr key={promotion._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                            {promotion.code}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {promotion.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {getDiscountDisplay(promotion)}
                          </span>
                          {promotion.minimumOrderAmount > 0 && (
                            <p className="text-xs text-gray-500">
                              Commande min: {promotion.minimumOrderAmount}€
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(promotion.startDate).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            au {new Date(promotion.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {promotion.usedCount || 0}
                            {promotion.usageLimit ? ` / ${promotion.usageLimit}` : ' / ∞'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(promotion)}
                              className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                              title="Modifier la promotion"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              onClick={() => togglePromotionStatus(promotion)}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                promotion.isActive 
                                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                              title={promotion.isActive ? 'Désactiver' : 'Activer'}
                            >
                              {promotion.isActive ? 'Désactiver' : 'Activer'}
                            </button>
                            <button
                              onClick={() => handleDelete(promotion._id)}
                              className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                              title="Supprimer la promotion"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingPromotion ? 'Modifier la Promotion' : 'Créer une Nouvelle Promotion'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code Promotionnel *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: ETE2024"
                      required
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ex: Promotion été 2024 - 20% de réduction"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Type de réduction */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de Réduction *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="percentage">Pourcentage de réduction</option>
                      <option value="fixed">Montant fixe de réduction</option>
                      <option value="free_shipping">Livraison gratuite</option>
                    </select>
                  </div>

                  {/* Valeur de la réduction */}
                  {formData.discountType !== 'free_shipping' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valeur de la Réduction * {formData.discountType === 'percentage' ? '(%)' : '(€)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.discountType === 'percentage' ? '100' : ''}
                        value={formData.discountValue}
                        onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Montant minimum de commande */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Montant Minimum de Commande (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimumOrderAmount}
                      onChange={(e) => setFormData({...formData, minimumOrderAmount: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Réduction maximale */}
                  {formData.discountType === 'percentage' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Réduction Maximale (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.maximumDiscount}
                        onChange={(e) => setFormData({...formData, maximumDiscount: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Aucune limite si vide"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date de début */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de Début *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Date de fin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de Fin *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Limite d'utilisation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite d'Utilisation
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Illimitée si vide"
                    />
                  </div>

                  {/* Statut actif */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-3 text-sm font-medium text-gray-700">
                      Promotion active
                    </label>
                  </div>
                </div>

                {/* Actions du formulaire */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    {editingPromotion ? 'Mettre à jour' : 'Créer la Promotion'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPromotion(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionManagement;
