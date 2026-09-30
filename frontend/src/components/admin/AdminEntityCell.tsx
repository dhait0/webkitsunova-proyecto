import type { ReactNode } from 'react';

type AdminEntityCellProps = {
  initials: string;
  name: ReactNode;
  meta?: ReactNode;
};

export function AdminEntityCell({ initials, name, meta }: AdminEntityCellProps) {
  return (
    <div className="admin-entity-cell">
      <span className="admin-entity-avatar" aria-hidden="true">
        {initials}
      </span>
      <span className="admin-entity-info">
        <span className="admin-entity-name">{name}</span>
        {meta ? <span className="admin-entity-meta">{meta}</span> : null}
      </span>
    </div>
  );
}

export default AdminEntityCell;
