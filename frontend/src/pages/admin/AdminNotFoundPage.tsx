import { Link } from 'react-router-dom';
import { ADMIN_NAV_SECTIONS } from '@/components/admin/adminNav';
import Icon from '@/components/admin/Icon';

const availableItems = ADMIN_NAV_SECTIONS.flatMap((section) =>
  section.items.filter((item) => !item.comingSoon)
);

function AdminNotFoundPage() {
  return (
    <div className="admin-page admin-not-found">
      <div className="admin-not-found-card">
        <span className="admin-not-found-code">404</span>
        <h1>Esta sección no existe</h1>
        <p>
          La página que buscas no está disponible en el panel de administración. Puede que el enlace
          sea incorrecto o que el módulo aún no esté implementado.
        </p>

        <div className="admin-not-found-links">
          {availableItems.map((item) => (
            <Link key={item.to} to={item.to} className="admin-btn admin-btn-ghost">
              <Icon name={item.icon} size={13} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminNotFoundPage;
