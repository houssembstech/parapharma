import React, { useState, useEffect } from 'react';
import { promotionAPI } from '../../services/api'; // Adjust the import path as needed

const PromotionManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
    applicableProducts: [],
    applicableCategories: []
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promotionAPI.getPromotions();
      
      // Handle different possible response structures
      let promotionsData = [];
      if (Array.isArray(response.data)) {
        promotionsData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        promotionsData = response.data.data;
      } else if (response.data && Array.isArray(response.data.promotions)) {
        promotionsData = response.data.promotions;
      }
      
      setPromotions(promotionsData);
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setError('Failed to fetch promotions');
      setPromotions([]); // Ensure promotions is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Prepare data for API
      const apiData = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minimumOrderAmount: parseFloat(formData.minimumOrderAmount),
        maximumDiscount: formData.maximumDiscount ? parseFloat(formData.maximumDiscount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      if (editingPromotion) {
        await promotionAPI.updatePromotion(editingPromotion._id, apiData);
      } else {
        await promotionAPI.createPromotion(apiData);
      }

      setShowForm(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      setError('Failed to save promotion');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscount: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      isActive: true,
      applicableProducts: [],
      applicableCategories: []
    });
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      minimumOrderAmount: promotion.minimumOrderAmount,
      maximumDiscount: promotion.maximumDiscount || '',
      startDate: formatDateForInput(promotion.startDate),
      endDate: formatDateForInput(promotion.endDate),
      usageLimit: promotion.usageLimit || '',
      isActive: promotion.isActive,
      applicableProducts: promotion.applicableProducts || [],
      applicableCategories: promotion.applicableCategories || []
    });
    setShowForm(true);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        setError(null);
        await promotionAPI.deletePromotion(id);
        fetchPromotions();
      } catch (error) {
        console.error('Error deleting promotion:', error);
        setError('Failed to delete promotion');
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading promotions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Promotion Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add New Promotion
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPromotion ? 'Edit Promotion' : 'Add New Promotion'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {formData.discountType !== 'free_shipping' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Discount Value * {formData.discountType === 'percentage' ? '(%)' : '($)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Order Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimumOrderAmount}
                    onChange={(e) => setFormData({...formData, minimumOrderAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Discount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maximumDiscount}
                      onChange={(e) => setFormData({...formData, maximumDiscount: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Usage Limit</label>
                <input
                  type="number"
                  min="0"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty for unlimited usage"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingPromotion ? 'Update' : 'Create'} Promotion
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {promotions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No promotions found.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create your first promotion
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions.map((promotion) => (
                <tr key={promotion._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-semibold">
                    {promotion.code}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{promotion.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promotion.discountType === 'percentage' 
                      ? `${promotion.discountValue}%`
                      : promotion.discountType === 'fixed'
                      ? `$${promotion.discountValue}`
                      : 'Free Shipping'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(promotion.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {promotion.usedCount || 0}{promotion.usageLimit ? ` / ${promotion.usageLimit}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      promotion.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {promotion.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(promotion)}
                      className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(promotion._id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PromotionManagement;