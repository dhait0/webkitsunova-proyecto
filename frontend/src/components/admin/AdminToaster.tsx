import Icon from './Icon';
import type { IconName, ToastTone } from './types';

const ICONS: Record<ToastTone, IconName> = {
  success: 'checkCircle',
  error: 'alertCircle',
};

type AdminToasterProps = {
  toasts: { id: number; message: string; tone: ToastTone }[];
  dismiss: (id: number) => void;
};

export function AdminToaster({ toasts, dismiss }: AdminToasterProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="admin-toaster" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`admin-toast admin-toast--${toast.tone}`} role="status">
          <Icon name={ICONS[toast.tone]} className="admin-toast-icon" />
          <span className="admin-toast-message">{toast.message}</span>
          <button
            type="button"
            className="admin-toast-close"
            onClick={() => dismiss(toast.id)}
            aria-label="Descartar notificación"
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default AdminToaster;
