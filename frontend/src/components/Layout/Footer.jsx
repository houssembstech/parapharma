import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <h5 className="text-primary mb-3">
              <i className="bi bi-heart-pulse-fill me-2"></i>
              Parapharmacie TN
            </h5>
            <p className="text-muted">
              Votre parapharmacie en ligne de confiance en Tunisie. 
              Produits de qualité, livraison rapide et conseils professionnels.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light">
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a href="#" className="text-light">
                <i className="bi bi-instagram fs-5"></i>
              </a>
              <a href="#" className="text-light">
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a href="#" className="text-light">
                <i className="bi bi-linkedin fs-5"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-2 col-md-3 col-sm-6 mb-4">
            <h6 className="mb-3">Catégories</h6>
            <ul className="list-unstyled">
              <li><Link to="/category/skincare" className="text-muted text-decoration-none">Soins de la peau</Link></li>
              <li><Link to="/category/vitamins" className="text-muted text-decoration-none">Vitamines</Link></li>
              <li><Link to="/category/baby" className="text-muted text-decoration-none">Bébé & Maman</Link></li>
              <li><Link to="/category/hygiene" className="text-muted text-decoration-none">Hygiène</Link></li>
              <li><Link to="/category/medical" className="text-muted text-decoration-none">Matériel médical</Link></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-3 col-sm-6 mb-4">
            <h6 className="mb-3">Service Client</h6>
            <ul className="list-unstyled">
              <li><Link to="/contact" className="text-muted text-decoration-none">Contact</Link></li>
              <li><Link to="/faq" className="text-muted text-decoration-none">FAQ</Link></li>
              <li><Link to="/shipping" className="text-muted text-decoration-none">Livraison</Link></li>
              <li><Link to="/returns" className="text-muted text-decoration-none">Retours</Link></li>
              <li><Link to="/support" className="text-muted text-decoration-none">Support</Link></li>
            </ul>
          </div>

          <div className="col-lg-4 col-md-6 mb-4">
            <h6 className="mb-3">Contact Info</h6>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-geo-alt-fill text-primary me-2"></i>
              <span className="text-muted">Avenue Habib Bourguiba, Tunis 1000</span>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-telephone-fill text-primary me-2"></i>
              <span className="text-muted">+216 71 123 456</span>
            </div>
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-envelope-fill text-primary me-2"></i>
              <span className="text-muted">contact@parapharmacie-tn.com</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-clock-fill text-primary me-2"></i>
              <span className="text-muted">Lun-Sam: 8h-20h, Dim: 9h-18h</span>
            </div>
          </div>
        </div>

        <hr className="my-4 bg-secondary" />
        
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="text-muted mb-0">
              &copy; 2024 Parapharmacie TN. Tous droits réservés.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <div className="d-flex flex-wrap justify-content-md-end gap-3">
              <Link to="/privacy" className="text-muted text-decoration-none small">
                Politique de confidentialité
              </Link>
              <Link to="/terms" className="text-muted text-decoration-none small">
                Conditions d'utilisation
              </Link>
              <Link to="/cookies" className="text-muted text-decoration-none small">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;