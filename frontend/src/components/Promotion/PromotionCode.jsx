import React, { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';

const PromotionCode = () => {
  const [code, setCode] = useState('');
  const { applyPromotionCode, removePromotion, promotion, loading, error } = useCart();

  const handleApply = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      await applyPromotionCode(code.toUpperCase());
      setCode('');
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleRemove = () => {
    removePromotion();
    setCode('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <h3 className="text-lg font-semibold mb-4">Promotion Code</h3>
      
      {!promotion ? (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter promo code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Applying...' : 'Apply'}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-between bg-green-50 p-3 rounded-md">
          <div>
            <span className="font-semibold text-green-800">
              {promotion.promotion.code} Applied
            </span>
            <p className="text-sm text-green-600">
              {promotion.promotion.description} - Save ${promotion.discountAmount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Remove
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default PromotionCode;
