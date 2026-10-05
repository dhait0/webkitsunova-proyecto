import { useState } from 'react';
import { fieldEntryPage } from '@/content/siteContent';

const GripIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path d="M4 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PersonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5.5 20a6.5 6.5 0 0113 0" strokeLinecap="round" />
  </svg>
);

export function FieldRecord() {
  const [open, setOpen] = useState(false);
  const { stamp, title, lede, rows, escalation, footnote } = fieldEntryPage;

  return (
    <section id="proceso" className="kb-shell" aria-labelledby="proceso-titulo">
      <div className="kb-sheetwrap">
        <button
          type="button"
          className="kb-grip"
          aria-pressed={open}
          aria-controls="proceso-bajo"
          aria-label={open ? 'Bajar la hoja' : 'Levantar la hoja'}
          onClick={() => setOpen((prev) => !prev)}
        >
          <GripIcon />
        </button>

        <div className="kb-card kb-card--light">
          <div className="kb-card__head">
            <div>
              <span className="kb-label">{stamp}</span>
              <h2 className="kb-heading" id="proceso-titulo">
                {title}
              </h2>
            </div>
            <p className="kb-body">{lede}</p>
          </div>

          <ul className="kb-records">
            {rows.map((row) => (
              <li className={`kb-record${row.escalated ? ' kb-record--escalated' : ''}`} key={row.date}>
                <span className="kb-record__date kb-numeral">{row.date}</span>
                <span className="kb-record__stage">{row.stage}</span>
                <div className="kb-record__body">
                  <p className="kb-record__note">{row.note}</p>
                  {row.escalated && (
                    <span className="kb-record__tab">
                      <PersonIcon />
                      {escalation}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <span className="kb-stamp">Toca el asa para ver debajo</span>
        </div>
      </div>

      <div id="proceso-bajo" className="kb-card kb-under" hidden={!open}>
        <span className="kb-label">Debajo de la hoja</span>
        <h3 className="kb-subhead kb-under__title">La automatización solo escribe la primera línea</h3>
        <p className="kb-body">
          Kitsunova organiza lo que registras, detecta el patrón y propone un ajuste, sin pedirte
          permiso. Lo que no hace es decidir por ti cuándo eso dejó de ser suficiente. En ese momento
          la anotación cambia de estado y aparece una persona, con su propia agenda y su propio
          criterio. El cambio no suma un contador: cambia la página.
        </p>
        <p className="kb-footnote kb-under__note">{footnote}</p>
      </div>
    </section>
  );
}