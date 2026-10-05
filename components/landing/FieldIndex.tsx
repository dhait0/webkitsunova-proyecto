import { fieldApp, fieldIndexRows } from '@/content/siteContent';

export function FieldIndex() {
  return (
    <section id="que-obtienes" className="kb-shell" aria-labelledby="obtienes-titulo">
      <div className="kb-card">
        <div className="kb-card__head">
          <div>
            <span className="kb-label">Qué obtienes</span>
            <h2 className="kb-heading" id="obtienes-titulo">
              Lo que ya existe, escrito sin adornos
            </h2>
          </div>
          <p className="kb-body">
            Esto es lo que la plataforma hace hoy. No hay cifras de usuarios, porque no las
            tenemos.
          </p>
        </div>

        <div className="kb-index">
          {fieldIndexRows.map((row) => (
            <div className="kb-index__row" key={row.title}>
              <span className="kb-index__mark" aria-hidden="true" />
              <div>
                <h3 className="kb-subhead">{row.title}</h3>
                <p>{row.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FieldApp() {
  return (
    <section className="kb-shell" id="app" aria-labelledby="app-titulo">
      <div className="kb-card">
        <div className="kb-card__head">
          <div>
            <span className="kb-label">Aplicación móvil</span>
            <h2 className="kb-heading" id="app-titulo">
              {fieldApp.title}
            </h2>
          </div>
          <p className="kb-body">{fieldApp.lede}</p>
        </div>

        <div className="kb-phones">
          <img src="/brand/celulares.webp" alt="Dos teléfonos con la interfaz de Kitsunova" width={1600} height={1493} loading="lazy" />
        </div>

        <div className="kb-store">
          <button type="button" className="kb-btn kb-btn--quiet" disabled>
            Google Play
          </button>
          <button type="button" className="kb-btn kb-btn--quiet" disabled>
            App Store
          </button>
          <p className="kb-store__note">Todavía no hay app publicada. Estos botones se activan el día del lanzamiento.</p>
        </div>
      </div>
    </section>
  );
}