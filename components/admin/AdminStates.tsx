export function AdminLoading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="admin-loading" role="status" aria-live="polite">
      <div className="admin-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

type AdminEmptyStateProps = {
  message: string;
  hint?: string;
  icon?: string;
};

export function AdminEmptyState({ message, hint, icon }: AdminEmptyStateProps) {
  return (
    <div className="admin-empty-state">
      {icon ? (
        <span className="admin-empty-state-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <strong>{message}</strong>
      {hint ? <span className="admin-empty-state-hint">{hint}</span> : null}
    </div>
  );
}

type AdminErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function AdminErrorState({ message, onRetry }: AdminErrorStateProps) {
  return (
    <div className="admin-error" role="alert">
      <span className="admin-error-message">{message}</span>
      {onRetry ? (
        <button type="button" className="admin-btn admin-btn-ghost" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export default AdminLoading;
