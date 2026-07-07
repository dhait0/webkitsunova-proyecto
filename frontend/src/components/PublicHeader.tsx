import { Link } from 'react-router-dom';

function PublicHeader() {
  return (
    <header className="main-navbar">
      <div className="navbar-container">
        <Link to="/" className="logo-container" aria-label="Inicio de Kitsunova">
          <img src="/brand/imagotipo.png" alt="Kitsunova" className="logo" />
        </Link>

        <nav className="main-nav-links" aria-label="Navegación principal">
          <a href="#como-funciona" className="active">
            Cómo funciona
          </a>
          <a href="#solucion">Solución</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#app">App</a>
          <a href="#registro">Registro</a>
        </nav>

        <div className="auth-buttons">
          <Link to="/login" className="login-btn">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicHeader;
