import Link from 'next/link';

/**
 * Shown instead of the psychologist screens when an administrator opens the
 * psychologist area. Those screens read and write the signed-in psychologist's
 * own data through Server Actions that only accept `PSYCHOLOGIST`; an
 * administrator has no such data, so the actions would refuse every call.
 */
export default function PsyAdminNotice() {
  return (
    <section className="panel-card" aria-labelledby="psy-admin-notice-title">
      <div className="panel-head">
        <div>
          <span className="eyebrow">Vista de administrador</span>
          <h2 id="psy-admin-notice-title">Esta área muestra los datos de cada psicólogo</h2>
        </div>
      </div>
      <p>
        Pacientes, sesiones, mensajes y recursos pertenecen a cada psicólogo, y tu cuenta de
        administrador no tiene un perfil de psicólogo propio. Para revisar o aprobar psicólogos
        usa el panel de administración.
      </p>
      <div className="psy-panel-actions">
        <Link className="primary-btn" href="/admin/psychologists">
          Ir a Psicólogos
        </Link>
        <Link className="secondary-btn" href="/admin">
          Volver a Administración
        </Link>
      </div>
    </section>
  );
}
