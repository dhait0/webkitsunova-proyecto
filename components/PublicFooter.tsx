import Link from 'next/link';
import { fieldFooter } from '@/content/siteContent';

interface PublicFooterProps {
  showSectionLinks?: boolean;
}

export function PublicFooter({ showSectionLinks = true }: PublicFooterProps) {
  return (
    <footer className="kb-footer">
      <div className={`kb-shell kb-footer__grid${showSectionLinks ? '' : ' kb-footer__grid--dos'}`}>
        <div className="kb-footer__brand">
          <img src="/brand/isotipo.webp" alt="Kitsunova" width={150} height={140} />
          <p>{fieldFooter.promise}</p>
        </div>

        {showSectionLinks && (
          <div>
            <h3>En esta página</h3>
            <ul>
              {fieldFooter.quickLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3>Acceso</h3>
          <ul>
            {fieldFooter.areas.map((link) => (
              <li key={link.label}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="kb-shell kb-footer__bottom">
        <p>&copy; 2026 Kitsunova. Todos los derechos reservados.</p>
        <p>Proyecto full-stack en desarrollo activo.</p>
      </div>
    </footer>
  );
}

export default PublicFooter;
