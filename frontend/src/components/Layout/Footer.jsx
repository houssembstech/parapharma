import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light py-5 mt-auto">
      <div className="container">
        <div className="row">
          {/* Brand Section */}
          <div className="col-lg-4 mb-4">
            <h5 className="text-primary mb-3 d-flex align-items-center">
              <i className="bi bi-heart-pulse-fill me-2"></i>
              Parapharmacie
            </h5>
            <p className="text-light-emphasis mb-4" style={{ color: '#b0b7c3' }}>
              Votre parapharmacie en ligne de confiance en Tunisie. 
              Produits de qualité, livraison rapide et conseils professionnels.
            </p>
            <div className="d-flex gap-3">
              <a 
                href="https://facebook.com" 
                className="text-light hover-primary transition-all"
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a 
                href="https://instagram.com" 
                className="text-light hover-primary transition-all"
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <i className="bi bi-instagram fs-5"></i>
              </a>
              <a 
                href="https://twitter.com" 
                className="text-light hover-primary transition-all"
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a 
                href="https://linkedin.com" 
                className="text-light hover-primary transition-all"
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <i className="bi bi-linkedin fs-5"></i>
              </a>
            </div>
          </div>

          {/* Categories Section */}
          <div className="col-lg-2 col-md-3 col-sm-6 mb-4">
            <h6 className="mb-3 text-white fw-semibold">Catégories</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                
                  Soins de la peau
                
              </li>
              <li className="mb-2">
                
                  Vitamines
                
              </li>
              <li className="mb-2">
                
                  Bébé & Maman
                
              </li>
              <li className="mb-2">
                
                  Hygiène
                
              </li>
              <li className="mb-2">
               
                  Matériel médical
                
              </li>
            </ul>
          </div>

                    {/* Contact Info Section */}
          <div className="col-lg-4 col-md-6 mb-4">
            <h6 className="mb-3 text-white fw-semibold">Informations de Contact</h6>
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-geo-alt-fill text-primary me-3 fs-6"></i>
              <span className="text-light-emphasis" style={{ color: '#b0b7c3' }}>
                Avenue Habib Bourguiba,<br />
                Tunis 1000, Tunisie
              </span>
            </div>
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-telephone-fill text-primary me-3 fs-6"></i>
              <div>
                <span className="text-light-emphasis d-block" style={{ color: '#b0b7c3' }}>+216 71 123 456</span>
                <span className="text-light-emphasis d-block" style={{ color: '#b0b7c3' }}>+216 23 468 877</span>
              </div>
            </div>
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-envelope-fill text-primary me-3 fs-6"></i>
              <span className="text-light-emphasis" style={{ color: '#b0b7c3' }}>contact@parapharmacie.tn</span>
            </div>
            <div className="d-flex align-items-start">
              <i className="bi bi-clock-fill text-primary me-3 fs-6 mt-1"></i>
              <div>
                <span className="text-light-emphasis d-block" style={{ color: '#b0b7c3' }}>Lun - Sam: 8h00 - 20h00</span>
                <span className="text-light-emphasis d-block" style={{ color: '#b0b7c3' }}>Dimanche: 9h00 - 18h00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-4 bg-light opacity-25" />
        
        

        {/* Payment Methods */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="text-center">
              <p className="text-light-emphasis small mb-2" style={{ color: '#b0b7c3' }}>Moyens de paiement acceptés</p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <i className="bi bi-credit-card text-light-emphasis fs-4" title="Carte de crédit" style={{ color: '#b0b7c3' }}></i>
                <i className="bi bi-paypal text-light-emphasis fs-4" title="PayPal" style={{ color: '#b0b7c3' }}></i>
                <i className="bi bi-cash-coin text-light-emphasis fs-4" title="Paiement à la livraison" style={{ color: '#b0b7c3' }}></i>
                <i className="bi bi-bank text-light-emphasis fs-4" title="Virement bancaire" style={{ color: '#b0b7c3' }}></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline CSS for hover effects */}
      <style>{`
        .hover-primary:hover {
          color: var(--bs-primary) !important;
          transform: translateY(-2px);
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .mt-auto {
          margin-top: auto;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
