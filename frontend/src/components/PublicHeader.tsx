import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PictureImage } from '@/components/ui';

function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="logo-container" aria-label="Inicio de Kitsunova" onClick={closeMenu}>
          <PictureImage
            src="/brand/imagotipo.png"
            alt="Kitsunova"
            width={400}
            height={160}
            loading="eager"
            className="logo"
          />
        </Link>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          <span />
          <span />
          <span />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="main-nav"
              className="main-nav-links open"
              aria-label="Navegación principal"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <a href="#como-funciona" className="active" onClick={closeMenu}>
                Cómo funciona
              </a>
              <a href="#solucion" onClick={closeMenu}>
                Solución
              </a>
              <a href="#beneficios" onClick={closeMenu}>
                Beneficios
              </a>
              <a href="#app" onClick={closeMenu}>
                App
              </a>
              <a href="#registro" onClick={closeMenu}>
                Registro
              </a>

              <div className="auth-buttons mobile-auth">
                <Link to="/login" className="login-btn" onClick={closeMenu}>
                  Iniciar sesión
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        <div className="auth-buttons desktop-auth">
          <Link to="/login" className="login-btn" onClick={closeMenu}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
