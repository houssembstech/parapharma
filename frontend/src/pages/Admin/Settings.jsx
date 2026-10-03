import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../services/api';
import AdminSidebar from '../../components/Layout/AdminSidebar';
import AdminMobileHeader from '../../components/Layout/AdminMobileHeader';
import { FiLock, FiCheckCircle } from 'react-icons/fi';

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      return setError('Les nouveaux mots de passe ne correspondent pas.');
    }

    if (newPassword.length < 6) {
      return setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    }

    setLoading(true);
    try {
      const { data } = await API.put('/auth/profile/password', {
        currentPassword,
        newPassword
      });
      setMessage(data.message || 'Mot de passe mis à jour avec succès.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100">
      <AdminMobileHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="container-fluid py-4">
        <div className="row g-4">
          <AdminSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />

          <div className={`${sidebarCollapsed ? 'col-lg-11' : 'col-lg-10'} col-md-9`}>
            {/* Header Content */}
            <div className="d-flex justify-content-between align-items-end mb-4 bg-white p-4 rounded-4 shadow-sm">
              <div>
                <h4 className="fw-bold mb-1">Paramètres</h4>
                <p className="text-muted mb-0">Modifier les paramètres de sécurité de votre compte.</p>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-white border-0 pt-4 pb-0 px-4">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiLock className="me-2 text-primary" />
                  Changer le mot de passe
                </h5>
              </div>
              <div className="card-body p-4">
                {message && (
                  <div className="alert alert-success d-flex align-items-center" role="alert">
                    <FiCheckCircle className="me-2" />
                    {message}
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-muted">Mot de passe actuel</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      required 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted">Nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      required 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted">Confirmer le nouveau mot de passe</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      required 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary px-4 py-2"
                    disabled={loading}
                  >
                    {loading ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
