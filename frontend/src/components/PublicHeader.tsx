import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PictureImage } from '@/components/ui';
import { siteNavigation } from '@/content/siteContent';
import { scrollToSection, useActiveSection } from '@/hooks/useActiveSection';

const NAV_IDS = siteNavigation.map((item) => item.id);

function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeId = useActiveSection(NAV_IDS);

  const closeMenu = () => setMenuOpen(false);

  function handleAnchor(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    closeMenu();
    scrollToSection(id);
  }

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

        {/* Visible from 640px up; the burger handles everything below. */}
        <nav id="main-nav" className="main-nav-links desktop-nav" aria-label="Navegación principal">
          {siteNavigation.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeId === item.id ? 'active' : ''}
              aria-current={activeId === item.id ? 'page' : undefined}
              onClick={(event) => handleAnchor(event, item.id)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="main-nav-mobile"
        >
          <span />
          <span />
          <span />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              id="main-nav-mobile"
              className="main-nav-links mobile-nav open"
              aria-label="Navegación principal"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {siteNavigation.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={activeId === item.id ? 'active' : ''}
                  aria-current={activeId === item.id ? 'page' : undefined}
                  onClick={(event) => handleAnchor(event, item.id)}
                >
                  {item.label}
                </a>
              ))}

              <div className="auth-buttons mobile-auth">
                <Link to="/login" className="login-btn" onClick={closeMenu}>
                  Iniciar sesión
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        <div className="auth-buttons desktop-auth">
          <Link to="/login" className="login-btn">
            Iniciar sesión
          </Link>
          <button
            type="button"
            className="login-btn login-btn--primary"
            onClick={() => scrollToSection('registro')}
          >
            Crear cuenta
          </button>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
