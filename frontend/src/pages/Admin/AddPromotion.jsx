import React, { useState } from "react";
import axios from "../../services/api"; // central axios instance
import { useAuth } from "../../context/AuthContext";

const AddPromotion = () => {
  const { token } = useAuth(); // get admin token
  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      await axios.post("/promotions", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Promotion created successfully ✅");
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
        usageLimit: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong ❌");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Promotion</h2>

      {success && <p className="text-green-600 mb-2">{success}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Promo Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Discount Type</label>
          <select
            name="discountType"
            value={formData.discountType}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </div>

        <div>
          <label className="block font-medium">Discount Value</label>
          <input
            type="number"
            name="discountValue"
            value={formData.discountValue}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Usage Limit</label>
          <input
            type="number"
            name="usageLimit"
            value={formData.usageLimit}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Leave empty for unlimited"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Create Promotion
        </button>
      </form>
    </div>
  );
};

export default AddPromotion;
