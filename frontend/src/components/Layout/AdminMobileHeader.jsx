import React from 'react';
import { FiMenu, FiBell } from 'react-icons/fi';

const AdminMobileHeader = ({ title, onMenuClick }) => {
  return (
    <div className="d-md-none mb-4">
      <div className="card shadow-sm border-0 rounded-4">
        <div className="card-body py-3">
          <div className="d-flex align-items-center justify-content-between">
            <button 
              className="btn btn-outline-success"
              onClick={onMenuClick}
            >
              <FiMenu size={20} />
            </button>
            <div className="text-center flex-grow-1">
              <h6 className="mb-0 text-success fw-bold">{title}</h6>
            </div>
            <div className="bg-light rounded-pill px-3 py-1 position-relative">
              <FiBell size={18} className="text-success" />
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                3
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMobileHeader;