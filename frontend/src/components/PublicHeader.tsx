import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { fieldNav } from '@/content/siteContent';
import { scrollToSection, useActiveSection } from '@/hooks/useActiveSection';

const FIELD_NAV_IDS = fieldNav.map((item) => item.id);

interface PublicHeaderProps {
  showSections?: boolean;
}

export function PublicHeader({ showSections = true }: PublicHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const activeId = useActiveSection(FIELD_NAV_IDS);

  const closeMenu = () => setMenuOpen(false);

  function handleAnchor(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    closeMenu();
    scrollToSection(id);
  }

  return (
    <header className="kb-nav">
      <div className="kb-shell kb-nav__inner">
        <Link to="/" className="kb-nav__brand" aria-label="Inicio de Kitsunova" onClick={closeMenu}>
          <img src="/brand/imagotipo.webp" alt="Kitsunova" width={200} height={80} />
        </Link>

        {showSections && (
          <nav className="kb-tabs" aria-label="Secciones de esta página">
            {fieldNav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="kb-tab"
                aria-current={activeId === item.id ? 'page' : undefined}
                onClick={(event) => handleAnchor(event, item.id)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <Link
          to="/login"
          className={`kb-btn kb-btn--quiet kb-nav__session${showSections ? '' : ' kb-nav__session--solo'}`}
        >
          Iniciar sesión
        </Link>

        {showSections && (
          <button
            type="button"
            className="kb-toggle"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="kb-nav-mobile"
          >
            <span className="kb-toggle__bars" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSections && menuOpen && (
          <motion.nav
            id="kb-nav-mobile"
            className="kb-tabs kb-tabs--stack"
            aria-label="Secciones de esta página"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {showSections &&
              fieldNav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="kb-tab"
                  onClick={(event) => handleAnchor(event, item.id)}
                >
                  {item.label}
                </a>
              ))}
            <Link to="/login" className="kb-tab" onClick={closeMenu}>
              Iniciar sesión
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default PublicHeader;
