import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-5 col-md-7">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i className="bi bi-person-circle text-primary fs-1 mb-3"></i>
                <h2 className="h3 mb-2">Connexion</h2>
                <p className="text-muted">
                  Connectez-vous à votre compte Parapharmacie TN
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
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
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">
                    Mot de passe <span className="text-danger">*</span>
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
                      placeholder="Votre mot de passe"
                      required
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="form-check">
                    <input 
                      type="checkbox" 
                      className="form-check-input" 
                      id="rememberMe"
                    />
                    <label className="form-check-label small" htmlFor="rememberMe">
                      Se souvenir de moi
                    </label>
                  </div>
                  <Link to="/forgot-password" className="small text-decoration-none">
                    Mot de passe oublié ?
                  </Link>
                </div>

                <div className="d-grid gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Connexion...</span>
                        </span>
                        Connexion...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Se connecter
                      </>
                    )}
                  </button>
                </div>
              </form>

              <hr className="my-4" />

              <div className="text-center">
                <p className="mb-0">
                  Pas encore de compte ?{' '}
                  <Link to="/register" className="text-decoration-none fw-medium">
                    Créer un compte
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
                <i className="bi bi-truck text-primary fs-4"></i>
                <div className="small text-muted mt-1">Livraison rapide</div>
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

export default Login;