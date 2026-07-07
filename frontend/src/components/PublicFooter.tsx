import { Link } from 'react-router-dom';

function PublicFooter() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img src="/brand/isotipo.png" alt="Kitsunova" className="footer-logo" />
          <p>Hábitos, apoyo profesional y seguimiento continuo</p>
        </div>

        <div className="footer-links">
          <h4>Enlaces rápidos</h4>
          <ul>
            <li>
              <a href="#como-funciona">Cómo funciona</a>
            </li>
            <li>
              <a href="#solucion">Solución</a>
            </li>
            <li>
              <a href="#beneficios">Beneficios</a>
            </li>
            <li>
              <a href="#app">App</a>
            </li>
            <li>
              <Link to="/login">Acceso</Link>
            </li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Acceso rápido</h4>
          <ul>
            <li>
              <a href="#registro">Registro</a>
            </li>
            <li>
              <a href="#solucion">Qué ofrece</a>
            </li>
            <li>
              <a href="#beneficios">Casos de uso</a>
            </li>
            <li>
              <a href="#app">Descarga</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Kitsunova. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

export default PublicFooter;
