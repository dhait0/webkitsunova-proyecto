import { useState } from 'react';
import { Link } from 'react-router-dom';

function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="logo-container" aria-label="Inicio de Kitsunova" onClick={closeMenu}>
          <img src="/brand/imagotipo.png" alt="Kitsunova" className="logo" />
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

        <nav
          id="main-nav"
          className={`main-nav-links${menuOpen ? ' open' : ''}`}
          aria-label="Navegación principal"
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
        </nav>

        <div className="auth-buttons">
          <Link to="/login" className="login-btn" onClick={closeMenu}>
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
