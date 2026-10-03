import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const { resetPassword, loading, error, success, clearError, clearSuccess } = useAuth();
  const [localError, setLocalError] = useState('');
  const { resetToken } = useParams(); // Note: utilise resetToken au lieu de token
  const navigate = useNavigate();

  console.log('🔑 ResetPassword component loaded with token:', resetToken);

  useEffect(() => {
    console.log('🔄 ResetPassword useEffect running');
    clearError();
    clearSuccess();
    setLocalError('');

    // Vérifiez que le token est présent
    if (!resetToken) {
      setLocalError('Token de réinitialisation manquant');
    }
  }, [resetToken, clearError, clearSuccess]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    clearSuccess();
    setLocalError('');

    console.log('🚀 Submit attempt with token:', resetToken);

    // Validation côté client
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!resetToken) {
      setLocalError('Token de réinitialisation invalide');
      return;
    }

    try {
      console.log('📤 Sending reset request...');
      const result = await resetPassword(resetToken, formData.password);
      console.log('📥 Reset result:', result);
      
      if (result.success) {
        // Le succès est géré par le contexte Auth
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.' 
            } 
          });
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Reset password error:', err);
    }
  };

  // Afficher soit l'erreur locale soit l'erreur du contexte
  const displayError = localError || error;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="bi bi-key-fill text-primary fs-1 mb-3"></i>
                <h2 className="h3 mb-2">Nouveau mot de passe</h2>
                <p className="text-muted">
                  Entrez votre nouveau mot de passe
                </p>
              </div>

              {/* Debug info - à retirer en production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="alert alert-warning small" role="alert">
                  <strong>Debug:</strong> Token: {resetToken || 'NON FOURNI'}
                </div>
              )}

              {displayError && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {displayError}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                  <div className="mt-2">
                    <i className="bi bi-clock me-1"></i>
                    Redirection vers la page de connexion dans 3 secondes...
                  </div>
                </div>
              )}

              {!success && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Nouveau mot de passe <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Votre nouveau mot de passe"
                        required
                        minLength="6"
                        disabled={loading}
                      />
                    </div>
                    <div className="form-text">
                      Minimum 6 caractères
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmer le mot de passe <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock-fill"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirmez votre mot de passe"
                        required
                        minLength="6"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="d-grid gap-2 mb-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={loading || !formData.password || !formData.confirmPassword || !resetToken}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Réinitialisation...</span>
                          </span>
                          Réinitialisation...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Réinitialiser le mot de passe
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-0">
                  <Link to="/login" className="text-decoration-none fw-medium">
                    <i className="bi bi-arrow-left me-1"></i>
                    Retour à la connexion
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
