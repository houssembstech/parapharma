import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword, loading, error, clearError } = useAuth();
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess('');

    const result = await forgotPassword(email);
    if (result.success) {
      setSuccess(result.message);
      setEmail('');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="bi bi-key text-primary fs-1 mb-3"></i>
                <h2 className="h3 mb-2">Mot de passe oublié</h2>
                <p className="text-muted">
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-text">
                    Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </div>
                </div>

                <div className="d-grid gap-2 mb-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Envoi...</span>
                        </span>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Envoyer le lien
                      </>
                    )}
                  </button>
                </div>
              </form>

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

          <div className="text-center mt-4">
            <div className="row">
              <div className="col-4">
                <i className="bi bi-shield-check text-success fs-4"></i>
                <div className="small text-muted mt-1">Sécurisé</div>
              </div>
              <div className="col-4">
                <i className="bi bi-clock-history text-warning fs-4"></i>
                <div className="small text-muted mt-1">Lien valide 1h</div>
              </div>
              <div className="col-4">
                <i className="bi bi-headset text-info fs-4"></i>
                <div className="small text-muted mt-1">Support 24/7</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
